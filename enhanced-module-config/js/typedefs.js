/**
 * @typedef ExternalModules
 * @type {{
 *  showEnhancedConfig?: function(string, int):void
 *  configsByPrefixJSON?: []
 *  PID:int
 *  emcDebug: boolean
 *  emcAjax: {{
 *    verification: string
 *    get: string
 *    save: string
 *  }}
 * }}
 */

/**
 * @typedef SettingChoice
 * @type {{
 * value: string
 * name: string
 * }}
 */

/**
 * @typedef BranchingLogicCondition
 * @type {{
 * value: string
 * field: string
 * op: string
 * }}
 */

/**
 * @typedef BranchingLogic
 * @type {{
 * field: string
 * value: string
 * op: string
 * type: string
 * conditions: BranchingLogicCondition[]
 * }}
 */

/**
 * @typedef SettingConfig
 * @type {{
 * key: string
 * type: string
 * name: string
 * description: string
 * required: boolean
 * hidden: boolean
 * repeatable: boolean
 * autocomplete: boolean
 * 'super-user-only': boolean
 * 'help-text': string
 * 'help-url': string
 * tab: string
 * sub_settings: SettingConfig[]
 * choices: SettingChoice[]
 * branchingLogic: BranchingLogic
 * }}
 */

/**
 * @typedef SettingDependencies
 * @type {{
 * valid: string[]
 * path: string[]
 * branchingLogic: any[]
 * scope: string[]
 * }}
 */

/**
 * @typedef ModuleSetting
 * @type {{
 * value: any
 * config: SettingConfig
 * type: string
 * dependencies: SettingDependencies
 * }}
 */

/**
 * @typedef TabInfo
 * @type {{
 * name: string
 * key: string
 * 'help-text': string
 * 'help-url': string
 * main: boolean
 * }}
 */

 /**
 * @typedef ModuleSettingsInfos
 * @type {{
 * original?: ModuleSetting[]
 * originalHash?: string
 * current?: ModuleSetting[]
 * tabs?: TabInfo[]
 * }}
 */

 /**
  * @typedef ModuleInfo
  * @type {{
  * prefix?: string
  * version?: string
  * name?: string
  * pid?: int
  * }}
  */
