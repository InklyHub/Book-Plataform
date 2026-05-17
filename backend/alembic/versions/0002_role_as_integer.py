"""role as integer: 0=lector, 1=escritor, 2=ambos

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-16

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Añadir columna temporal entera
    op.add_column("users", sa.Column("role_int", sa.Integer(), nullable=True))

    # 2. Mapear valores existentes: 'reader' → 0, 'writer' → 1
    op.execute("""
        UPDATE users
        SET role_int = CASE
            WHEN role = 'writer' THEN 1
            ELSE 0
        END
    """)

    # 3. Eliminar columna original
    op.drop_column("users", "role")

    # 4. Renombrar la nueva columna
    op.alter_column("users", "role_int", new_column_name="role",
                    nullable=False, server_default="0")


def downgrade() -> None:
    # 1. Añadir columna temporal varchar
    op.add_column("users", sa.Column("role_str", sa.String(20), nullable=True))

    # 2. Mapear valores: 0 → 'reader', 1 → 'writer', 2 → 'writer' (mejor aproximación)
    op.execute("""
        UPDATE users
        SET role_str = CASE
            WHEN role = 1 THEN 'writer'
            WHEN role = 2 THEN 'writer'
            ELSE 'reader'
        END
    """)

    # 3. Eliminar columna entera
    op.drop_column("users", "role")

    # 4. Renombrar la columna varchar
    op.alter_column("users", "role_str", new_column_name="role",
                    nullable=False, server_default="reader")
