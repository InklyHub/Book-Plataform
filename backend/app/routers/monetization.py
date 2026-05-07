from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.dependencies import CurrentUser, CurrentWriter, DB
from app.models.book import Book
from app.models.chapter import Chapter
from app.models.monetization import (
    ChapterPurchase,
    CoinPackage,
    CoinTransaction,
    MonetizationSettings,
    Subscription,
    UserSubscription,
)
from app.schemas.monetization import (
    CoinPackageOut,
    CoinTransactionOut,
    MonetizationSettingsIn,
    MonetizationSettingsOut,
    PurchaseCoinPackageIn,
    SubscribeIn,
    SubscriptionOut,
    UnlockChapterIn,
    UserSubscriptionOut,
)

router = APIRouter()


# ── Monetización de libros ─────────────────────────────────────────────────────

@router.get("/book/{book_id}/settings", response_model=MonetizationSettingsOut)
async def get_monetization(book_id: UUID, current_user: CurrentWriter, db: DB):
    ms = await db.get(MonetizationSettings, book_id)
    if not ms:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return ms


@router.put("/book/{book_id}/settings", response_model=MonetizationSettingsOut)
async def set_monetization(
    book_id: UUID, body: MonetizationSettingsIn, current_user: CurrentWriter, db: DB
):
    book = await db.get(Book, book_id)
    if not book or book.author_id != current_user.id:
        raise HTTPException(status_code=404, detail="Libro no encontrado o sin permiso")

    ms = await db.get(MonetizationSettings, book_id)
    if ms:
        ms.model = body.model
        ms.price_per_chapter = body.price_per_chapter
        ms.coins_per_chapter = body.coins_per_chapter
        ms.platform_cut_pct = settings.PLATFORM_CUT_PERCENT
    else:
        ms = MonetizationSettings(
            book_id=book_id,
            model=body.model,
            price_per_chapter=body.price_per_chapter,
            coins_per_chapter=body.coins_per_chapter,
            platform_cut_pct=settings.PLATFORM_CUT_PERCENT,
        )
        db.add(ms)
        book.is_monetized = True

    await db.flush()
    return ms


# ── Coins ─────────────────────────────────────────────────────────────────────

@router.get("/coins/packages", response_model=list[CoinPackageOut])
async def list_coin_packages(db: DB):
    result = await db.execute(
        select(CoinPackage).where(CoinPackage.is_active == True).order_by(CoinPackage.price)
    )
    return result.scalars().all()


@router.post("/coins/purchase")
async def purchase_coins(body: PurchaseCoinPackageIn, current_user: CurrentUser, db: DB):
    package = await db.get(CoinPackage, body.package_id)
    if not package or not package.is_active:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    total_coins = package.coins + package.bonus
    current_user.coins += total_coins

    db.add(CoinTransaction(
        user_id=current_user.id,
        amount=total_coins,
        type="purchase",
        reference=str(package.id),
    ))

    return {
        "message": f"¡Compraste {total_coins} coins!",
        "coins_added": total_coins,
        "new_balance": current_user.coins,
    }


@router.post("/coins/unlock-chapter")
async def unlock_chapter(body: UnlockChapterIn, current_user: CurrentUser, db: DB):
    chapter = await db.get(Chapter, body.chapter_id)
    if not chapter or not chapter.is_locked:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado o no está bloqueado")

    existing = await db.execute(
        select(ChapterPurchase).where(
            ChapterPurchase.user_id == current_user.id,
            ChapterPurchase.chapter_id == body.chapter_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Capítulo ya desbloqueado")

    cost = chapter.price_coins or 0
    if current_user.coins < cost:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Coins insuficientes. Necesitas {cost}, tienes {current_user.coins}",
        )

    current_user.coins -= cost
    db.add(ChapterPurchase(user_id=current_user.id, chapter_id=body.chapter_id, coins_spent=cost))
    db.add(CoinTransaction(
        user_id=current_user.id,
        amount=-cost,
        type="spend",
        reference=str(body.chapter_id),
    ))

    return {
        "message": "Capítulo desbloqueado",
        "coins_spent": cost,
        "new_balance": current_user.coins,
    }


@router.get("/coins/transactions", response_model=list[CoinTransactionOut])
async def get_transactions(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(CoinTransaction)
        .where(CoinTransaction.user_id == current_user.id)
        .order_by(CoinTransaction.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


# ── Subscriptions ─────────────────────────────────────────────────────────────

@router.get("/subscriptions", response_model=list[SubscriptionOut])
async def list_subscriptions(db: DB):
    result = await db.execute(
        select(Subscription).where(Subscription.is_active == True).order_by(Subscription.price_monthly)
    )
    return result.scalars().all()


@router.post("/subscriptions/subscribe", response_model=UserSubscriptionOut)
async def subscribe(body: SubscribeIn, current_user: CurrentUser, db: DB):
    subscription = await db.get(Subscription, body.subscription_id)
    if not subscription or not subscription.is_active:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    # Cancelar suscripción activa previa
    existing = await db.execute(
        select(UserSubscription).where(
            UserSubscription.user_id == current_user.id,
            UserSubscription.is_active == True,
        )
    )
    old_sub = existing.scalar_one_or_none()
    if old_sub:
        old_sub.is_active = False

    now = datetime.now(timezone.utc)
    user_sub = UserSubscription(
        user_id=current_user.id,
        subscription_id=subscription.id,
        started_at=now,
        expires_at=now + timedelta(days=30),
        is_active=True,
    )
    db.add(user_sub)

    # Acreditar coins del mes
    current_user.coins += subscription.coins_per_month
    db.add(CoinTransaction(
        user_id=current_user.id,
        amount=subscription.coins_per_month,
        type="earn",
        reference=f"subscription:{subscription.id}",
    ))

    await db.flush()
    result = await db.execute(
        select(UserSubscription)
        .where(UserSubscription.id == user_sub.id)
        .options(selectinload(UserSubscription.subscription))
    )
    return result.scalar_one()


@router.get("/subscriptions/me", response_model=UserSubscriptionOut | None)
async def get_my_subscription(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(UserSubscription)
        .where(UserSubscription.user_id == current_user.id, UserSubscription.is_active == True)
        .options(selectinload(UserSubscription.subscription))
    )
    return result.scalar_one_or_none()
