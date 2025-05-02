import React from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Button,
  } from "@mui/material";
  import MenuIcon from "@mui/icons-material/Menu";
  import SettingsIcon from "@mui/icons-material/Settings";

  import {  
    useNavigate,
} from "react-router-dom";


export default function NavBar() {
    const navigate = useNavigate();
    return (
    //   <AppBar position="static" sx={{ backgroundColor: "#3f51b5" }}>
    <AppBar position="static" sx={{ backgroundColor: "var(--button-background)" }}>
        <Toolbar>
          <Typography
            variant="h5"
            sx={{
              flexGrow: 1,
              fontWeight: "bold",
              letterSpacing: "0.1em",
              cursor: "pointer",
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
            }}
            onClick={() => navigate("/")}
          >
            Planorama
          </Typography>
  
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button color="inherit" onClick={() => navigate("/dependencies")}>
              Dependencies
            </Button>
            <Button color="inherit" onClick={() => navigate("/teams")}>
              Teams
            </Button>
            <Button color="inherit" onClick={() => navigate("/streak")}>
              Streak
            </Button>
            <Button color="inherit" onClick={() => navigate("/weeklysummary")}>
              Weekly Summary
            </Button>
            <Button color="inherit" onClick={() => navigate("/gensearch")}>
              Search
            </Button>
            {/* <Button color="inherit" onClick={() => navigate("/templates")}>
              Templates
            </Button>
            <Button color="inherit" onClick={() => navigate("/archive")}>
              Archive 
            </Button>*/}
            <Button color="inherit" onClick={() => navigate("/productivity")}>
              Productivity
            </Button>
            <IconButton color="inherit" onClick={() => navigate("/settings")}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
    );
  }