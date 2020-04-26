/**
 * @typedef ExternalModules
 * @type {{
 *  showEnhancedConfig?: function(string, int):void
 *  configsByPrefixJSON?: Object<string, SettingConfig>
 *  versionsByPrefixJSON?: Object<string, string>
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
 * value: any
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
 * @typedef Validation
 * @type {{
 * type: string // Any of integer, number, string, date, datetime, json (must be valid) letters a-z, chars (of given in pattern), regex, custom (calls validateSetting method/hook); allow comma and dot for decimal; no thousand!
 * pattern: string // for chars, regex, displayformat for date (internal will always be y-m-d)
 * min: int // min value or min length
 * max: int // max value or max length
 * 'custom-ajax': bool // on-the-fly custom validation
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
 * placeholder: string
 * validation: Validation
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
 * count: integer
 * repeats: boolean
 * hassubs: boolean
 * dependencies: SettingDependencies
 * guid: string
 * sub: ModuleSetting[]
 * parent: ModuleSetting
 * siblings: Object<string, ModuleSetting>
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
 * @typedef SettingValue
 * @type {{
 * guid: string
 * key: string
 * value: any
 * hidden: boolean
 * }}
 */

 
 /**
 * @typedef ModuleSettingsInfos
 * @type {{
 * original?: ModuleSetting[]
 * originalHash?: string
 * current?: ModuleSetting[]
 * tabs?: TabInfo[],
 * guid?: string
 * values?: Object<string, SettingValue>
 * }}
 */

 /**
  * @typedef ModuleInfo
  * @type {{
  * prefix?: string
  * version?: string
  * name?: string
  * pid?: int
  * guid?: string
  * }}
  */
