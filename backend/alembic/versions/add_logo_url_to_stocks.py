"""add logo_url to stocks

Revision ID: 5a2b3c4d5e6f
Revises: 4628673c6aac
Create Date: 2025-10-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a2b3c4d5e6f'
down_revision: Union[str, None] = '4628673c6aac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add logo_url column to stocks table
    op.add_column('stocks', sa.Column('logo_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    # Remove logo_url column from stocks table
    op.drop_column('stocks', 'logo_url')

