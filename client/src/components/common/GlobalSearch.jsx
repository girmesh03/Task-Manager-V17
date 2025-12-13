// client/src/components/common/GlobalSearch.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GroupsIcon from "@mui/icons-material/Groups";
import InventoryIcon from "@mui/icons-material/Inventory";
import StoreIcon from "@mui/icons-material/Store";
import { useGetUsersQuery } from "../../redux/features/user/userApi";
import { useGetTasksQuery } from "../../redux/features/task/taskApi";
import { useGetDepartmentsQuery } from "../../redux/features/department/departmentApi";
import { useGetMaterialsQuery } from "../../redux/features/material/materialApi";
import { useGetVendorsQuery } from "../../redux/features/vendor/vendorApi";
import { ROUTES, PAGINATION } from "../../utils/constants";

/**
 * GlobalSearch Component
 *
 * Global search component that searches across all resources.
 * Accessible via Ctrl+K or Cmd+K keyboard shortcut.
 *
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Close handler
 * @returns {JSX.Element}
 */
const GlobalSearch = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data with search query (limit to 5 results per resource for quick preview)
  const SEARCH_RESULT_LIMIT = 5;

  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery(
    { search: debouncedQuery, limit: SEARCH_RESULT_LIMIT },
    { skip: !debouncedQuery || debouncedQuery.length < 2 }
  );

  const { data: tasksData, isLoading: tasksLoading } = useGetTasksQuery(
    { search: debouncedQuery, limit: SEARCH_RESULT_LIMIT },
    { skip: !debouncedQuery || debouncedQuery.length < 2 }
  );

  const { data: departmentsData, isLoading: departmentsLoading } =
    useGetDepartmentsQuery(
      { search: debouncedQuery, limit: SEARCH_RESULT_LIMIT },
      { skip: !debouncedQuery || debouncedQuery.length < 2 }
    );

  const { data: materialsData, isLoading: materialsLoading } =
    useGetMaterialsQuery(
      { search: debouncedQuery, limit: SEARCH_RESULT_LIMIT },
      { skip: !debouncedQuery || debouncedQuery.length < 2 }
    );

  const { data: vendorsData, isLoading: vendorsLoading } = useGetVendorsQuery(
    { search: debouncedQuery, limit: SEARCH_RESULT_LIMIT },
    { skip: !debouncedQuery || debouncedQuery.length < 2 }
  );

  const users = usersData?.users || [];
  const tasks = tasksData?.tasks || [];
  const departments = departmentsData?.departments || [];
  const materials = materialsData?.materials || [];
  const vendors = vendorsData?.vendors || [];

  const isLoading =
    usersLoading ||
    tasksLoading ||
    departmentsLoading ||
    materialsLoading ||
    vendorsLoading;
  const hasResults =
    users.length > 0 ||
    tasks.length > 0 ||
    departments.length > 0 ||
    materials.length > 0 ||
    vendors.length > 0;

  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
      onClose();
      setSearchQuery("");
    },
    [navigate, onClose]
  );

  const handleClose = () => {
    onClose();
    setSearchQuery("");
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Box
          component="span"
          key={index}
          sx={{ bgcolor: "warning.light", fontWeight: 600 }}
        >
          {part}
        </Box>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
      aria-labelledby="global-search-title"
      aria-describedby="global-search-description"
      slotProps={{
        paper: {
          sx: (theme) => ({
            backgroundImage: "none",
            position: isMobile ? "fixed" : "absolute",
            top: isMobile ? theme.spacing(0) : 80,
            m: 0,
            "&.MuiDialog-paper": {
              borderRadius: isMobile ? 0 : "auto",
            },
          }),
        },
      }}
    >
      <DialogContent id="global-search-description" sx={{ p: 0 }}>
        {/* Visually hidden title for screen readers */}
        <Box
          id="global-search-title"
          sx={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          Global Search Dialog
        </Box>

        {/* Search Input */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <TextField
            fullWidth
            placeholder="Search across all resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {isLoading && <CircularProgress size={20} />}
                    <IconButton
                      size="small"
                      onClick={handleClose}
                      sx={{ border: "none" }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {/* Search Results */}
        <Box sx={{ maxHeight: 500, overflow: "auto", p: 2 }}>
          {!debouncedQuery || debouncedQuery.length < 2 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <SearchIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Type at least 2 characters to search
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 1 }}
              >
                Press Ctrl+K or Cmd+K to open search
              </Typography>
            </Box>
          ) : !hasResults && !isLoading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No results found for "{debouncedQuery}"
              </Typography>
            </Box>
          ) : (
            <>
              {/* Departments */}
              {departments.length > 0 && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <GroupsIcon color="primary" />
                      <Typography>
                        Departments ({departments.length})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List>
                      {departments.map((dept) => (
                        <ListItem key={dept._id} disablePadding>
                          <ListItemButton
                            onClick={() =>
                              handleNavigate(
                                `${ROUTES.DEPARTMENTS}/${dept._id}`
                              )
                            }
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <GroupsIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={highlightText(dept.name, debouncedQuery)}
                              secondary={dept.description}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Users */}
              {users.length > 0 && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PeopleIcon color="primary" />
                      <Typography>Users ({users.length})</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List>
                      {users.map((user) => (
                        <ListItem key={user._id} disablePadding>
                          <ListItemButton
                            onClick={() =>
                              handleNavigate(`${ROUTES.USERS}/${user._id}`)
                            }
                          >
                            <ListItemAvatar>
                              <Avatar src={user.profilePicture?.url}>
                                {user.firstName?.[0]}
                                {user.lastName?.[0]}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={highlightText(
                                user.fullName,
                                debouncedQuery
                              )}
                              secondary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    alignItems: "center",
                                  }}
                                >
                                  <Chip label={user.role} size="small" />
                                  <Typography variant="caption">
                                    • {user.department?.name}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Tasks */}
              {tasks.length > 0 && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AssignmentIcon color="primary" />
                      <Typography>Tasks ({tasks.length})</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List>
                      {tasks.map((task) => (
                        <ListItem key={task._id} disablePadding>
                          <ListItemButton
                            onClick={() =>
                              handleNavigate(`${ROUTES.TASKS}/${task._id}`)
                            }
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <AssignmentIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={highlightText(
                                task.title,
                                debouncedQuery
                              )}
                              secondary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    alignItems: "center",
                                  }}
                                >
                                  <Chip
                                    label={task.taskType?.replace("Task", "")}
                                    size="small"
                                  />
                                  <Chip label={task.status} size="small" />
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Materials */}
              {materials.length > 0 && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <InventoryIcon color="primary" />
                      <Typography>Materials ({materials.length})</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List>
                      {materials.map((material) => (
                        <ListItem key={material._id} disablePadding>
                          <ListItemButton
                            onClick={() =>
                              handleNavigate(
                                `${ROUTES.MATERIALS}/${material._id}`
                              )
                            }
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <InventoryIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={highlightText(
                                material.name,
                                debouncedQuery
                              )}
                              secondary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    alignItems: "center",
                                  }}
                                >
                                  <Chip
                                    label={material.category}
                                    size="small"
                                  />
                                  <Typography variant="caption">
                                    • ${material.price} / {material.unit}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Vendors */}
              {vendors.length > 0 && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <StoreIcon color="primary" />
                      <Typography>Vendors ({vendors.length})</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List>
                      {vendors.map((vendor) => (
                        <ListItem key={vendor._id} disablePadding>
                          <ListItemButton
                            onClick={() =>
                              handleNavigate(`${ROUTES.VENDORS}/${vendor._id}`)
                            }
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <StoreIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={highlightText(
                                vendor.name,
                                debouncedQuery
                              )}
                              secondary={vendor.email}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
