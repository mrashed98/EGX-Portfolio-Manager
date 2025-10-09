"""Add portfolio snapshots and history

Revision ID: c9d8e0f2a3b4
Revises: bd79edaec8a0
Create Date: 2025-10-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c9d8e0f2a3b4'
down_revision: Union[str, None] = 'bd79edaec8a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create portfolio_snapshots table
    op.create_table(
        'portfolio_snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('portfolio_id', sa.Integer(), nullable=False),
        sa.Column('snapshot_date', sa.DateTime(), nullable=False),
        sa.Column('total_value', sa.Float(), nullable=False),
        sa.Column('stock_count', sa.Integer(), nullable=False),
        sa.Column('stock_prices', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['portfolio_id'], ['portfolios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_portfolio_snapshots_id'), 'portfolio_snapshots', ['id'], unique=False)
    op.create_index(op.f('ix_portfolio_snapshots_portfolio_id'), 'portfolio_snapshots', ['portfolio_id'], unique=False)
    op.create_index(op.f('ix_portfolio_snapshots_snapshot_date'), 'portfolio_snapshots', ['snapshot_date'], unique=False)

    # Create portfolio_history table
    op.create_table(
        'portfolio_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('portfolio_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('changes', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['portfolio_id'], ['portfolios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_portfolio_history_id'), 'portfolio_history', ['id'], unique=False)
    op.create_index(op.f('ix_portfolio_history_portfolio_id'), 'portfolio_history', ['portfolio_id'], unique=False)
    op.create_index(op.f('ix_portfolio_history_created_at'), 'portfolio_history', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop portfolio_history table
    op.drop_index(op.f('ix_portfolio_history_created_at'), table_name='portfolio_history')
    op.drop_index(op.f('ix_portfolio_history_portfolio_id'), table_name='portfolio_history')
    op.drop_index(op.f('ix_portfolio_history_id'), table_name='portfolio_history')
    op.drop_table('portfolio_history')

    # Drop portfolio_snapshots table
    op.drop_index(op.f('ix_portfolio_snapshots_snapshot_date'), table_name='portfolio_snapshots')
    op.drop_index(op.f('ix_portfolio_snapshots_portfolio_id'), table_name='portfolio_snapshots')
    op.drop_index(op.f('ix_portfolio_snapshots_id'), table_name='portfolio_snapshots')
    op.drop_table('portfolio_snapshots')

