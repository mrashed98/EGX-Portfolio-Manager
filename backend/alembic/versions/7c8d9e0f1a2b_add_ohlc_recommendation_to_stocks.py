"""add ohlc and recommendation to stocks

Revision ID: 7c8d9e0f1a2b
Revises: 6b7c8d9e0f1a
Create Date: 2025-10-09 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c8d9e0f1a2b'
down_revision: Union[str, None] = '6b7c8d9e0f1a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add OHLC and recommendation columns to stocks table
    op.add_column('stocks', sa.Column('open_price', sa.Float(), nullable=True))
    op.add_column('stocks', sa.Column('high_price', sa.Float(), nullable=True))
    op.add_column('stocks', sa.Column('low_price', sa.Float(), nullable=True))
    op.add_column('stocks', sa.Column('volume', sa.Float(), nullable=True))
    op.add_column('stocks', sa.Column('change', sa.Float(), nullable=True))
    op.add_column('stocks', sa.Column('change_percent', sa.Float(), nullable=True))
    op.add_column('stocks', sa.Column('recommendation', sa.String(length=50), nullable=True))


def downgrade() -> None:
    # Remove OHLC and recommendation columns from stocks table
    op.drop_column('stocks', 'recommendation')
    op.drop_column('stocks', 'change_percent')
    op.drop_column('stocks', 'change')
    op.drop_column('stocks', 'volume')
    op.drop_column('stocks', 'low_price')
    op.drop_column('stocks', 'high_price')
    op.drop_column('stocks', 'open_price')


