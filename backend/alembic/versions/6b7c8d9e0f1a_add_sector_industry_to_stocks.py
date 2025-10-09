"""add sector and industry to stocks

Revision ID: 6b7c8d9e0f1a
Revises: 5a2b3c4d5e6f
Create Date: 2025-10-09 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b7c8d9e0f1a'
down_revision: Union[str, None] = '5a2b3c4d5e6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add sector and industry columns to stocks table
    op.add_column('stocks', sa.Column('sector', sa.String(length=100), nullable=True))
    op.add_column('stocks', sa.Column('industry', sa.String(length=100), nullable=True))


def downgrade() -> None:
    # Remove sector and industry columns from stocks table
    op.drop_column('stocks', 'industry')
    op.drop_column('stocks', 'sector')


