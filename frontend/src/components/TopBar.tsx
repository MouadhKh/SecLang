import { AppBar, Link, Toolbar, Typography } from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import HelpIcon from "@mui/icons-material/Help";
const TopBar = () => {
  return (
    <AppBar
      elevation={0}
      style={{
        background: "#FFFFFF",
        borderBottom: "2px solid #DFF3E3",
      }}
      position="fixed"
    >
      <Toolbar>
        <SecurityIcon
          style={{
            color: "#197278",
          }}
          sx={{
            display: {
              xs: "flex",
            },
            mr: 1,
          }}
        />
        <Typography
          variant="h6"
          noWrap
          component="a"
          href="/"
          sx={{
            flexGrow: 1,
            mr: 10,
            display: {
              xs: "flex",
            },
            fontFamily: "Raleway",
            fontWeight: 700,
            letterSpacing: ".1rem",
            color: "#197278",
            textDecoration: "none",
          }}
        >
          SecLang
        </Typography>

        <Link
          href="https://github.com/MouadhKh/SecLang"
          target="_blank"
          rel="noopener"
          underline="none"
        >
          <HelpIcon sx={{ color: "#352F44" }} />
          <Typography sx={{ color: "#352F44", mr: 8 }}> Docs</Typography>
        </Link>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
