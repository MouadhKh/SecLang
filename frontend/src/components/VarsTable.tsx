import { useState } from "react";
import { SecurityClassColors, VarObject } from "../types";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import { getColorForSecurityClass } from "../constants";

const VarsTable = (props: { variables: VarObject[] }) => {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const sortedVariables = props.variables.slice().sort((a, b) => {
    if (sortOrder === "asc") {
      return a.securityClassInt - b.securityClassInt;
    } else {
      return b.securityClassInt - a.securityClassInt;
    }
  });

  const handleSortClick = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <TableContainer sx={{ overflow: "auto",maxHeight:"200px",border:"solid 1px #88AB75",marginBottom:"50px" }} component={Paper}>
      <Table size="small" stickyHeader>
        <TableHead >
          <TableRow>
            <TableCell align="center" style={{ fontWeight: "bold" }}>
              Variable Name
            </TableCell>
            <TableCell align="center" style={{ fontWeight: "bold" }}>
              Security Class{" "}
              <span onClick={handleSortClick} style={{ color:"#197278", cursor: "pointer" }}>
                {sortOrder === "asc" ? "▼" : "▲"}
              </span>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedVariables.map((variable) => (
            <TableRow
              key={variable.name}
              style={{
                backgroundColor: getColorForSecurityClass(
                  variable.securityClassStr as keyof SecurityClassColors
                ),
              }}
            >
              <TableCell align="center">{variable.name}</TableCell>
              <TableCell align="center">{variable.securityClassStr}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};


export default VarsTable;
