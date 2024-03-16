import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { Box, Button, Container, Grid, Tooltip } from "@mui/material";
import TopBar from "./TopBar";
import { ExecutionResult } from "./ExecutionResult";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { ErrorObject, VarObject } from "../types";
import VarsTable from "./VarsTable";
import ChannelContainer from "./ChannelContainer";
import { colorMappings } from "../constants";
import Footer from "./Footer";
import { runCode } from "../api_calls";
const languageId = "secure-lang";
monaco.languages.register({ id: languageId });

const tokenTypes = {
  keyword: "keyword",
  variable: "variable",
  string: "string",
  uSecurityClass: "uSecurityClass",
  cSecurityClass: "cSecurityClass",
  sSecurityClass: "sSecurityClass",
  tsSecurityClass: "tsSecurityClass",
  chUnclassified: "chUnclassified",
  chConfidential: "chConfidential",
  chSecret: "chSecret",
  chTopSecret: "chTopSecret",
};

const syntaxHighlightRules: monaco.languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      [
        /\b(if|else|while|read|write|then|endif|endwhile|int|bool|string|debug|open|close)\b/,
        tokenTypes.keyword,
      ],
      [/@[A-Za-z_]\w*/, tokenTypes.variable],
      [/".*?"/, tokenTypes.string],
      [/:\s*(U)\b/, tokenTypes.uSecurityClass], // Security classes preceded by colon
      [/:\s*(C)\b/, tokenTypes.cSecurityClass], // Security classes preceded by colon
      [/:\s*(TS)\b/, tokenTypes.tsSecurityClass], // Security classes preceded by colon
      [/:\s*(S)\b/, tokenTypes.sSecurityClass], // Security classes preceded by colon
      [/'Unclassified'/, tokenTypes.chUnclassified],
      [/'Confidential'/, tokenTypes.chConfidential],
      [/'Secret'/, tokenTypes.chSecret],
      [/'TopSecret'/, tokenTypes.chTopSecret],
    ],
  },
};

monaco.languages.setMonarchTokensProvider(languageId, syntaxHighlightRules);

monaco.editor.defineTheme("secureLangTheme", {
  base: "vs",
  inherit: false,
  colors: {
    "editor.foreground": "#000000",
  },
  rules: [
    {
      token: tokenTypes.chUnclassified,
      foreground: colorMappings.Unclassified,
    },
    {
      token: tokenTypes.chConfidential,
      foreground: colorMappings.Confidential,
    },
    {
      token: tokenTypes.chSecret,
      foreground: colorMappings.Secret,
    },
    {
      token: tokenTypes.chTopSecret,
      foreground: colorMappings.TopSecret,
    },
    {
      token: tokenTypes.uSecurityClass,
      foreground: colorMappings.Unclassified,
      fontStyle: "bold",
    },
    {
      token: tokenTypes.cSecurityClass,
      foreground: colorMappings.Confidential,
      fontStyle: "bold",
    },
    {
      token: tokenTypes.sSecurityClass,
      foreground: colorMappings.Secret,
      fontStyle: "bold",
    },
    {
      token: tokenTypes.tsSecurityClass,
      foreground: colorMappings.TopSecret,
      fontStyle: "bold",
    },

    { token: tokenTypes.keyword, fontStyle: "bold" },
  ],
});

const MainPage = (props: { sessionId: string }) => {
  const editorRef = useRef(null);
  const [executionResult, setExecutionResult] = useState("");
  const [code, setCode] = useState("");
  const [vars, setVars] = useState<Array<VarObject>>([]);
  const [channels, setChannels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editorRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const editorProps: any = {
        value: code,
        language: languageId,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        readOnly: false,
        fontFamily: "MonoLisa",
        fontSize: 14,
        theme: "secureLangTheme",
        wordWrap: "on",
        scrollbar: {
          vertical: "hidden",
          horizontal: "hidden",
        },
        overviewRulerBorder: false,
        renderLineHighlight: "none",
        minimap: { enabled: false },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
      };
      const editor = monaco.editor.create(editorRef.current, editorProps);
      editor.onDidChangeModelContent(() => setCode(editor.getValue()));
      editor.addAction({
        id: "execute-secLang",
        label: "Execute Code",
        keybindings: [monaco.KeyCode.F5],
        run: () => {
          // Example: Execute code and update result
          runCodeAndShowResults(editor.getValue());
        },
      });
      return () => {
        editor.dispose();
      };
    }
  }, []);

  function runCodeAndShowResults(code: string) {
    runCode(props.sessionId, code).then((data) => {
      const result = data.runResult;
      if (result) {
        if (data.variables) {
          setVars(data.variables);
        }
        if (data.channels) {
          setChannels(data.channels);
        }
        const resultsToDisplay = Object.values(data.runResult)
          .filter((value) => typeof value != "object")
          .join("\n");
        setExecutionResult(resultsToDisplay);
      } else {
        const error = data as ErrorObject;
        setExecutionResult(`${error.type}: ${error.message}`);
      }
    });
  }

  return (
    <div>
      <TopBar />
      <Container maxWidth="xl">
        <Tooltip title=" F5 " placement="right" arrow>
          <Button
            onClick={() => {
              runCodeAndShowResults(code);
            }}
            variant="contained"
            color="success"
            startIcon={<PlayArrowIcon />}
            sx={{
              left: "43.5%",
              marginTop: "64px",
              marginBottom: "3px",
              zIndex: 1,
            }}
          >
            Run
          </Button>
        </Tooltip>
        <Grid container spacing={2}>
          <Grid container item xs={6} direction={"column"}>
            <Box
              sx={{
                position: "relative",
                border: 1,
                borderColor: "#197278",
                paddingTop: "15px",
                marginBottom: "10px",
              }}
            >
              <div
                ref={editorRef}
                style={{
                  marginRight: "15px",
                  height: "calc(50vh - 64px)",
                }}
              />
            </Box>
            <ExecutionResult result={executionResult} />
          </Grid>

          <Grid container item xs={6} direction={"column"}>
            {vars.length > 0 && <VarsTable variables={vars} />}
            {channels && (
              <Grid container>
                <>
                  {Object.keys(channels).map((channel, index) => (
                    <Grid key={index} item xs={6} padding="3px">
                      <ChannelContainer
                        title={channel}
                        items={channels[channel].split("\n")}
                      />
                    </Grid>
                  ))}
                </>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </div>
  );
};

export default MainPage;
