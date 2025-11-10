// client/src/components/lists/UsersList.jsx
import { memo } from "react";
import { Grid, Stack, Box, Pagination } from "@mui/material";
import UserCard from "../cards/UserCard";

/**
 * UsersList Component - Optimized list rendering for users
 *
 * Responsibilities:
 * - Render grid of user cards
 * - Handle pagination UI
 * - Memoized to prevent unnecessary re-renders
 *
 * @param {Object} props
 * @param {Array} props.users - Array of user objects
 * @param {Object} props.pagination - Pagination state { page, totalPages }
 * @param {Function} props.onPageChange - Page change handler
 * @param {Function} props.onView - View user handler
 * @param {Function} props.onEdit - Edit user handler
 * @param {Function} props.onDelete - Delete user handler
 * @param {Function} props.onRestore - Restore user handler
 * @param {boolean} props.isFetching - Loading state for pagination
 * @returns {JSX.Element}
 */
const UsersList = ({
  users,
  pagination,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onRestore,
  isFetching,
}) => {
  return (
    <Stack direction="column" spacing={2}>
      {/* Users Grid */}
      <Grid container spacing={2}>
        {users.map((user) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={user._id}>
            <UserCard
              user={user}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={onPageChange}
            color="primary"
            size="large"
            disabled={isFetching}
          />
        </Box>
      )}
    </Stack>
  );
};

// Memoize to prevent re-renders when props haven't changed
export default memo(UsersList);
