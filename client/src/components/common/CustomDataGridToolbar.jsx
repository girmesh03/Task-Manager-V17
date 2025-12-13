// client/src/components/common/CustomDataGridToolbar.jsx
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import {
  Toolbar,
  ToolbarButton,
  ColumnsPanelTrigger,
  FilterPanelTrigger,
  QuickFilter,
  QuickFilterControl,
  QuickFilterClear,
  QuickFilterTrigger,
  useGridApiContext,
} from "@mui/x-data-grid";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

/**
 * CustomDataGridToolbar Component
 *
 * Custom toolbar for MuiDataGrid using MUI v7/v8 current API.
 * Provides export, filter, column visibility, and quick filter controls.
 *
 * Features:
 * - Column visibility panel trigger
 * - Filter panel trigger
 * - Quick filter with search functionality
 * - CSV export with custom filename
 *
 * @param {Object} props
 * @param {string} [props.fileName] - Export filename (default: "export")
 * @param {boolean} [props.showExport] - Show export button (default: true)
 * @param {boolean} [props.showFilters] - Show filter button (default: true)
 * @param {boolean} [props.showColumns] - Show column visibility button (default: true)
 * @param {boolean} [props.showQuickFilter] - Show quick filter (default: false)
 * @returns {JSX.Element}
 */
const CustomDataGridToolbar = ({
  fileName = "export",
  showExport = true,
  showFilters = true,
  showColumns = true,
  showQuickFilter = false,
}) => {
  const apiRef = useGridApiContext();

  // Handle CSV export
  const handleExportClick = () => {
    apiRef.current.exportDataAsCsv({
      fileName: fileName,
      delimiter: ",",
      utf8WithBom: true,
      includeHeaders: true,
      includeColumnGroupsHeaders: true,
    });
  };

  return (
    <Toolbar>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* Left side: Action buttons */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {showColumns && <ColumnsPanelTrigger />}
          {showFilters && <FilterPanelTrigger />}
          {showExport && (
            <ToolbarButton
              startIcon={<FileDownloadIcon />}
              onClick={handleExportClick}
            >
              Export
            </ToolbarButton>
          )}
        </Box>

        {/* Right side: Quick filter */}
        {showQuickFilter && (
          <Box
            sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center" }}
          >
            <QuickFilter>
              <QuickFilterTrigger />
              <QuickFilterControl />
              <QuickFilterClear />
            </QuickFilter>
          </Box>
        )}
      </Box>
    </Toolbar>
  );
};

CustomDataGridToolbar.propTypes = {
  fileName: PropTypes.string,
  showExport: PropTypes.bool,
  showFilters: PropTypes.bool,
  showColumns: PropTypes.bool,
  showQuickFilter: PropTypes.bool,
};

export default CustomDataGridToolbar;
