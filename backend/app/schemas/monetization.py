from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

VALID_MODELS = {"pay-per-chapter", "coins", "subscription"}


class MonetizationSettingsIn(BaseModel):
    model: str
    price_per_chapter: float | None = Field(default=None, ge=0.01)
    coins_per_chapter: int | None = Field(default=None, ge=1)

    @field_validator("model")
    @classmethod
    def validate_model(cls, v: str) -> str:
        if v not in VALID_MODELS:
            raise ValueError(f"model must be one of {VALID_MODELS}")
        return v


class MonetizationSettingsOut(BaseModel):
    book_id: UUID
    model: str
    price_per_chapter: float | None
    coins_per_chapter: int | None
    platform_cut_pct: int

    model_config = {"from_attributes": True}


# ── Coins ─────────────────────────────────────────────────────────────────────

class CoinPackageOut(BaseModel):
    id: UUID
    coins: int
    price: float
    bonus: int

    model_config = {"from_attributes": True}


class PurchaseCoinPackageIn(BaseModel):
    package_id: UUID


class UnlockChapterIn(BaseModel):
    chapter_id: UUID


class CoinTransactionOut(BaseModel):
    id: UUID
    amount: int
    type: str
    reference: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Subscriptions ─────────────────────────────────────────────────────────────

class SubscriptionOut(BaseModel):
    id: UUID
    name: str
    price_monthly: float
    coins_per_month: int

    model_config = {"from_attributes": True}


class SubscribeIn(BaseModel):
    subscription_id: UUID


class UserSubscriptionOut(BaseModel):
    id: UUID
    subscription: SubscriptionOut
    started_at: datetime
    expires_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}
