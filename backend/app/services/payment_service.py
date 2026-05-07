"""
Lógica de negocio para pagos: validación de coins y cálculo de ingresos para escritores.
"""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.monetization import ChapterPurchase, CoinTransaction
from app.models.chapter import Chapter


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_writer_earnings(self, author_id: UUID, platform_cut_pct: int = 30) -> dict:
        """
        Calcula ingresos del escritor basado en compras de capítulos.
        Devuelve gross (total coins recibidos) y net (después del corte de la plataforma).
        """
        # Suma de coins gastados en capítulos del autor
        result = await self.db.execute(
            select(func.sum(ChapterPurchase.coins_spent))
            .join(Chapter, ChapterPurchase.chapter_id == Chapter.id)
            .where(Chapter.book_id.in_(
                select(Chapter.book_id).where(Chapter.book_id.in_(
                    # Sub-query: libros del autor
                    select(Chapter.book_id)
                    .join(Chapter)
                    .correlate()
                ))
            ))
        )
        gross_coins = result.scalar_one_or_none() or 0
        net_coins = int(gross_coins * (1 - platform_cut_pct / 100))

        return {
            "gross_coins": gross_coins,
            "net_coins": net_coins,
            "platform_cut_pct": platform_cut_pct,
        }

    async def validate_coin_balance(self, user_coins: int, required: int) -> bool:
        return user_coins >= required

    async def get_total_spent(self, user_id: UUID) -> int:
        result = await self.db.execute(
            select(func.sum(CoinTransaction.amount))
            .where(
                CoinTransaction.user_id == user_id,
                CoinTransaction.type == "spend",
            )
        )
        spent = result.scalar_one_or_none() or 0
        return abs(int(spent))

    async def get_total_earned(self, user_id: UUID) -> int:
        result = await self.db.execute(
            select(func.sum(CoinTransaction.amount))
            .where(
                CoinTransaction.user_id == user_id,
                CoinTransaction.amount > 0,
            )
        )
        return int(result.scalar_one_or_none() or 0)
