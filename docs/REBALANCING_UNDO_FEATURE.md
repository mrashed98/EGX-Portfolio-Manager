# Rebalancing Undo Feature Implementation

## Overview
Added the ability to undo executed rebalancing actions in the strategy history page. This feature allows users to reverse a rebalancing operation, restoring holdings and cash to their state before the rebalancing was executed.

## Backend Changes

### 1. Database Model Update
**File**: `backend/app/models/rebalancing_history.py`

Added new fields to track undo status:
- `undone` (Boolean): Flag indicating if the rebalancing has been undone
- `undone_at` (DateTime, nullable): Timestamp when the rebalancing was undone

**Migration**: `d1e2f3g4h5i6_add_undo_fields_to_rebalancing.py`
- Adds `undone` column (defaults to False for existing records)
- Adds `undone_at` column (nullable)

### 2. Rebalancing Service
**File**: `backend/app/services/rebalancing_service.py`

Added `undo_rebalancing()` method that:
- Validates the rebalancing record exists and is executed
- Prevents undoing an already undone rebalancing
- Reverses all actions:
  - **BUY actions** → Sells the stocks back (removes from holdings)
  - **SELL actions** → Buys the stocks back (restores to holdings)
- Adjusts remaining cash accordingly
- Marks the rebalancing as undone with timestamp

**Key Logic**:
```python
# For original BUY action (undo by selling)
cash_from_sales += action_total
holding.quantity -= quantity

# For original SELL action (undo by buying back)
cash_for_purchases += action_total
holding.quantity += quantity

# Update cash (reverse of execution)
strategy.remaining_cash += (cash_from_sales - cash_for_purchases)
```

### 3. API Endpoint
**File**: `backend/app/api/routes/strategies.py`

New endpoint: `POST /strategies/{strategy_id}/rebalance/{rebalancing_id}/undo`

Features:
- Verifies strategy ownership
- Verifies rebalancing belongs to the strategy
- Calls rebalancing service to undo
- Returns error if rebalancing not found, not executed, or already undone

### 4. Schema Update
**File**: `backend/app/schemas/rebalancing.py`

Updated `RebalancingHistoryResponse` to include:
- `undone` field
- `undone_at` field

## Frontend Changes

### 1. History Page Update
**File**: `frontend/app/dashboard/strategies/[id]/history/page.tsx`

Changes:
- Updated `RebalancingHistory` interface with `undone` and `undone_at` fields
- Added `undoingId` state to track ongoing undo operations
- Added `handleUndo()` function with confirmation dialog
- Updated UI to show:
  - "Undone" badge for undone rebalancing
  - "Undo" button for executed (not undone) rebalancing
  - Loading state while undoing ("Undoing...")

**UI Behavior**:
- Undone rebalancing shows gray "Undone" badge
- Executed rebalancing shows green "Executed" badge + "Undo" button
- Undo button calls API and reloads data on success
- Confirmation dialog before undoing

## Key Features

### 1. Safety Checks
- Cannot undo a rebalancing that hasn't been executed
- Cannot undo a rebalancing that's already been undone
- Requires user confirmation before undoing

### 2. Complete Reversal
- All buy actions are reversed (stocks sold)
- All sell actions are reversed (stocks bought back)
- Cash is restored to pre-rebalancing amount
- Holdings are restored to pre-rebalancing state

### 3. Audit Trail
- Original rebalancing record is preserved
- Undone status is tracked with timestamp
- Both executed and undone rebalancing remain in history

### 4. User Experience
- Clear visual distinction between executed and undone
- Loading state during undo operation
- Success/error notifications
- Automatic data refresh after undo

## Usage Flow

1. User views strategy history page
2. Sees list of executed rebalancing actions
3. Clicks "Undo" button on a rebalancing record
4. Confirms the undo action in dialog
5. System reverses all actions:
   - Updates holdings
   - Adjusts remaining cash
   - Marks as undone
6. UI updates to show "Undone" status
7. Holdings in strategy details page reflect the reversed state

## Testing

To test the undo feature:

1. **Execute a rebalancing**:
   - Go to strategy details
   - Calculate rebalancing
   - Execute rebalancing actions

2. **Verify execution**:
   - Check holdings are updated
   - Check cash is adjusted
   - Go to history page

3. **Undo the rebalancing**:
   - Click "Undo" button
   - Confirm the action
   - Verify success message

4. **Verify undo**:
   - Check "Undone" badge appears
   - Go back to strategy details
   - Verify holdings are restored
   - Verify cash is restored

5. **Try to undo again**:
   - "Undone" rebalancing shows no "Undo" button
   - Cannot undo twice

## Limitations

1. **Multiple Holdings**: If a stock appears in multiple portfolios within a strategy, the undo applies to the first holding (same behavior as execution)

2. **Price Changes**: Undo uses the original execution prices, not current market prices

3. **No Cascade**: Undoing one rebalancing doesn't affect subsequent rebalancing actions

4. **Permanent Record**: Undone rebalancing remains in history (not deleted)

## Future Enhancements

Potential improvements:
1. Add reason/notes field for undo
2. Allow partial undo (select specific actions)
3. Show impact preview before undo
4. Redo functionality (undo the undo)
5. Bulk undo for multiple rebalancing
6. Export undo history to CSV

## Files Changed/Created

### Backend
- ✓ `backend/app/models/rebalancing_history.py` (updated - added undo fields)
- ✓ `backend/app/services/rebalancing_service.py` (updated - added undo method)
- ✓ `backend/app/api/routes/strategies.py` (updated - added undo endpoint)
- ✓ `backend/app/schemas/rebalancing.py` (updated - added undo fields)
- ✓ `backend/alembic/versions/d1e2f3g4h5i6_add_undo_fields_to_rebalancing.py` (new - migration)

### Frontend
- ✓ `frontend/app/dashboard/strategies/[id]/history/page.tsx` (updated - undo UI)

## Migration Status

✅ Migration `d1e2f3g4h5i6` applied successfully
✅ Backend running with new fields
✅ Frontend updated with undo functionality

## Notes

- Undo is instant and irreversible (once undone, the specific rebalancing cannot be re-executed)
- Users should understand that undoing affects holdings immediately
- Undo operation is logged with timestamp for audit purposes
- The feature maintains financial accuracy by properly adjusting cash and holdings

