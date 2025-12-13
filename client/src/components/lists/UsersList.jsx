// client/src/components/lists/UsersList.jsx
import { memo } from "react";
import { Grid, Stack, Box, Pagination } from "@mui/material";
import UserCard from "../cards/UserCard";

/**
 * UsersList Component - Optimized list rendering for users
 *
 * Responsibilities:
 * - Render grid of user cards
 * - Handle pagination UI with hasNext/hasPrev support
 * - Memoized to prevent unnecessary re-renders
 *
 * @param {Object} props
 * @param {Array} props.users - Array of user objects
 * @param {Object} props.pagination - Pagination state { page, totalPages, hasNext, hasPrev }
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
  const { page, totalPages, hasNext, hasPrev } = pagination;

  // Custom pagination handler that respects hasNext/hasPrev
  const handlePageChange = (event, newPage) => {
    // Prevent navigation if at boundaries
    if (newPage > page && !hasNext) return;
    if (newPage < page && !hasPrev) return;
    onPageChange(event, newPage);
  };

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
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            disabled={isFetching}
            // Disable buttons based on hasNext/hasPrev
            siblingCount={1}
            boundaryCount={1}
            showFirstButton={hasPrev}
            showLastButton={hasNext}
            hidePrevButton={!hasPrev}
            hideNextButton={!hasNext}
          />
        </Box>
      )}
    </Stack>
  );
};

// Memoize to prevent re-renders when props haven't changed
export default memo(UsersList);
