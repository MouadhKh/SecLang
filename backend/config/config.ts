import ConfigError from "../errors/ConfigError.ts";

interface Config {
  supported_channels: string[];
  environment: string;
  //extend if needed
}

async function loadConfig(): Promise<Config> {
  try {
    const data = await Deno.readTextFileSync("./config.json");
    const config = JSON.parse(data) as Config;
    return config;
  } catch (error) {
    throw new ConfigError(`Error loading configuration: ${error.message}`);
  }
}

const config = await loadConfig();

export const globalConfig = {
  environment: config.environment,
  supportedChannels: config.supported_channels,
};

export function updateConfig<T extends keyof Config>(
  propToUpdate: T,
  newValue: Config[T]
): void {
  const configFilePath = "./config.json";

  try {
    const configFileContent = Deno.readTextFileSync(configFilePath);
    const config: Config = JSON.parse(configFileContent);
    config[propToUpdate] = newValue;

    // Write the updated config back to the file
    Deno.writeTextFileSync(configFilePath, JSON.stringify(config, null, 2));

    console.log("Config updated successfully.");
  } catch (error) {
    throw new ConfigError(`Error updating config: ${error.message}`);
  }
}
