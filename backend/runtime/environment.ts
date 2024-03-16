import { globalConfig } from "../config/config.ts";
import ChannelError from "../errors/ChannelError.ts";
import CodeError from "../errors/CodeError.ts";
import SecurityError from "../errors/SecurityError.ts";
import Channel from "./channels/channel.ts";
import { getSecurityClassAsString } from "../security_extension/labels.ts";
import { RuntimeVal } from "./values.ts";
import { readChannelFile } from "../utils/files_utility.ts";

//Environment is the equivalent of Scope
export default class Environment {
  private _parent?: Environment;
  private _variables: Map<string, RuntimeVal>;
  private _channels: { [name: string]: Channel };
  private _constants: Set<string>;
  private _sessionId?: string; // set only in prod
  constructor(parentEnv?: Environment, sessionId?: string) {
    this._parent = parentEnv;
    this._variables = new Map();
    this._constants = new Set();
    this._channels = {};
    this._sessionId = sessionId;
    this.initChannels(globalConfig.supportedChannels);
  }

  public declareVar(varname: string, value: RuntimeVal, constant: boolean) {
    if (this._variables.has(varname)) {
      throw new CodeError(
        `Cannot declare variable ${varname}. As it is already defined in Scope.`
      );
    }
    this._variables.set(varname, value);
    if (constant) {
      this._constants.add(varname); 
    }
    return value;
  }

  public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
    const env = this.resolve(varname);
    // Cannot assign to a constant
    if (env._constants.has(varname)) {
      throw new CodeError(
        `Cannot reassign to '${varname}' as it is declared as a constant`
      );
    }
    //verify if assignment is possible(security class)
    const assigne = env.variables.get(varname);
    if (assigne!.type != value.type && assigne!.type != "null") {
      throw new TypeError(
        `Type missmatch at variable assignment. Can't assign '${
          value.type
        }' to '${assigne!.type}'`
      );
    }
    if (assigne!.securityClass < value.securityClass) {
      throw new SecurityError(
        `Information Flow Security breached: '${varname}' security class is lower than ${getSecurityClassAsString(
          value.securityClass
        )}`
      );
    }
    // value.securityClass = assigne!.securityClass; // this design implicitly change the security class of value
    env.variables.set(varname, value);
    return value;
  }

  public lookupVar(varname: string): RuntimeVal {
    const env = this.resolve(varname);
    return env.variables.get(varname) as RuntimeVal;
  }
  /**
   *  Get the environment(scope) that a variable belongs to
   * @param varname
   * @returns
   */
  public resolve(varname: string): Environment {
    if (this.variables.has(varname)) {
      return this;
    }
    if (this._parent == undefined) {
      throw new CodeError(`Cannot resolve '${varname}' as it does not exist.`);
    }
    return this._parent.resolve(varname);
  }

  openChannelForRead(name: string): void {
    this._channels[name].accessMode = "r";
    this._channels[name].open();
  }

  openChannelForWrite(name: string): void {
    this._channels[name].accessMode = "w";
    this._channels[name].open();
  }

  openChannel(name: string, accessMode: string) {
    if (!globalConfig.supportedChannels.includes(name)) {
      throw new ChannelError(`Channel ${name} is not suppported!`);
    }
    if (accessMode == "r") {
      this.openChannelForRead(name);
    } else {
      this.openChannelForWrite(name);
    }
  }
  closeChannel(name: string): void {
    // Close the channel
    const channel = this._channels[name];
    if (channel) {
      channel.close();
    } else {
      throw new ChannelError(`Channel '${name}' is not open.`);
    }
  }

  public getLastOpenedChannel(): Channel {
    const keys = Object.keys(this._channels);
    const lastAddedKey = keys[keys.length - 1];
    return this._channels[lastAddedKey];
  }
  public get variables(): Map<string, RuntimeVal> {
    return this._variables;
  }
  public set variables(value: Map<string, RuntimeVal>) {
    this._variables = value;
  }

  public get channels(): { [name: string]: Channel } {
    return this._channels;
  }

  public set channels(channels: { [name: string]: Channel }) {
    this._channels = channels;
  }
  public getChannelsContent(): Record<string, string> {
    const channelContents: Record<string, string> = {};

    for (const channelName in this._channels) {
      const channel = this._channels[channelName];
      channel.open();
      if (channel.fileDescriptor !== null) {
        const content = readChannelFile(channel);
        channelContents[channelName] = content;
      }
      channel.close();
    }

    return channelContents;
  }
  private initChannels(supportedChannels: string[]) {
    supportedChannels.forEach((channelName) => {
      this._channels[channelName] = new Channel(
        `${channelName}`,
        "r",
        this._sessionId
      ); 
    });
  }
}
