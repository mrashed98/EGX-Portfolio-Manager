"""Add undo fields to rebalancing history

Revision ID: d1e2f3g4h5i6
Revises: c9d8e0f2a3b4
Create Date: 2025-10-10 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1e2f3g4h5i6'
down_revision: Union[str, None] = 'c9d8e0f2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add undone column as nullable first
    op.add_column('rebalancing_history', sa.Column('undone', sa.Boolean(), nullable=True))
    
    # Set default value for existing rows
    op.execute('UPDATE rebalancing_history SET undone = false WHERE undone IS NULL')
    
    # Now make it NOT NULL
    op.alter_column('rebalancing_history', 'undone', nullable=False)
    
    # Add undone_at column (remains nullable)
    op.add_column('rebalancing_history', sa.Column('undone_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Drop the new columns
    op.drop_column('rebalancing_history', 'undone_at')
    op.drop_column('rebalancing_history', 'undone')

