import { getCurrentYear } from '../utils'
import { Box, Typography } from '@mui/material'

const Footer = () => {
  return (
    <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            borderTop:"solid 1px #DFF3E3",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "white", 
            color: "#978897",    
            fontSize:"small",
            fontFamily:"verdana",
            p: 0.5,   
          }}
        >
          <Typography variant="caption" color="#978897">
            Mouadh Khlifi - FU Berlin © {getCurrentYear()}
          </Typography>
        </Box>
  )
}

export default Footer