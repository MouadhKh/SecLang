import {
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  ListItemText,
} from "@mui/material";
import { getColorForSecurityClass } from "../constants";
import { SecurityClassColors } from "../types";
import { lightenColor } from "../utils";

type ChannelContainerProps = {
  title: string;
  items: string[];
};

const ChannelContainer = (props: ChannelContainerProps) => {
  const CONTAINER_COLOR = getColorForSecurityClass(
    props.title as keyof SecurityClassColors
  );
  return (
    <Card
      sx={{
        transitionDuration: "0.3s",
        height: "10vw",
        overflowY: "auto", // Scrollable if content exceeds height
        bgcolor: CONTAINER_COLOR,
      }}
    >
      <CardContent>
        <div
          style={{
            position: "sticky",
            borderBottom: "solid 1px rgba(255, 251, 252, .6)",
            top: 0, // Stick to the top
            backgroundColor: CONTAINER_COLOR, // Background color for the sticky header
            color: "#FFFBFC",
            padding: "5px",
            zIndex: 1,
          }}
        >
          <Typography variant="h6" align="center">
            {props.title}
          </Typography>
        </div>
        <Grid container direction="column" spacing={1}>
          {props.items.map((item, index) => (
            <Grid item key={index} xs={3}>
              {item != "" && (
                <Paper
                  elevation={0}
                  sx={{
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis", // Clipping text if too long
                    whiteSpace: "nowrap",
                    bgcolor: lightenColor(
                      getColorForSecurityClass(
                        props.title as keyof SecurityClassColors
                      ),
                      20
                    ),
                  }}
                >
                  <ListItemText primary={item} />
                </Paper>
              )}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ChannelContainer;
