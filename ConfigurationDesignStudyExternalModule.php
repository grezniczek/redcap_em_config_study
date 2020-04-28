<?php namespace DE\RUB\ConfigurationDesignStudyExternalModule;

use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

require_once __DIR__ . "/enhanced-module-config/classes/Crypto.php";

/**
 * ExternalModule class for Configuration Design Study.
 */
class ConfigurationDesignStudyExternalModule extends AbstractExternalModule {


    function redcap_module_link_check_display($project_id, $link) {
        if ($link["key"] == "demo") return $link;
        if ($link["key"] == "config") {
            if (self::IsSystemExternalModulesManager()) {
                $link["url"] = "javascript:ExternalModules.showEnhancedConfig(\"{$this->PREFIX}\"); //";
                return $link;
            }
            return null;
        }
    }

    function redcap_every_page_top ($project_id) {
        if (self::IsProjectExternalModulesManager() || self::IsSystemExternalModulesManager()) {
            // Inject HTML and JS for new config dialog.
            include (__DIR__."/enhanced-module-config/enhanced-module-config.php");
        }
    }

    private function includeScript($file, $inline = false) {
        if ($inline) {
            $script = file_get_contents(__DIR__ . "/$file");
            echo "<script type=\"text/javascript\">\n{$script}\n</script>";
        }
        else {
            echo '<script type="text/javascript" src="' . $this->framework->getUrl($file) . '"></script>';
        }
    }

    /**
     * Includes a CSS file (either in-line or as a separate resource).
     * @param string $name The path of the CSS file relative to the module folder.
     * @param bool $inline Determines whether the styles will be inlined or loaded as a separate resource.
     */
    private function includeCSS($name, $inline = false) {
        
        if ($inline) {
            $css = file_get_contents(__DIR__ ."/{$name}");
            echo "<style>\n{$css}\n</style>\n";
        }
        else {
            $css = $this->framework->getUrl($name);
            $name = md5($name);
            echo "<script type=\"text/javascript\">
                    (function() {
                        var id = 'emcCSS{$name}'
                        if (!document.getElementById(id)) {
                            var head = document.getElementsByTagName('head')[0]
                            var link = document.createElement('link')
                            link.id = id
                            link.rel = 'stylesheet'
                            link.type = 'text/css'
                            link.href = '{$css}'
                            link.media = 'all'
                            head.appendChild(link)
                        }
                    })();
                </script>";
        }
    }



    public static function IsSystemExternalModulesManager() {
        return (strpos(PAGE, "ExternalModules/manager/control_center.php") !== false) || (strpos(PAGE, "external_modules/manager/control_center.php") !== false);
    }

    public static function IsProjectExternalModulesManager() {
        return (strpos(PAGE, "ExternalModules/manager/project.php") !== false) || (strpos(PAGE, "external_modules/manager/project.php") !== false);
    }


    public function getSettingsAjax($prefix, $guid, $pid, $type) {
        // TODO: Checks
        $settings = $type == "project-settings" ? self::getEnhancedProjectSettings($prefix, $pid) : self::getEnhancedSystemSettings($prefix);


        // TODO: REMOVE - This fixes reserved system settings to have "system-reserved-tab" as tab key.
        foreach (array(
            ExternalModules::KEY_LANGUAGE_SYSTEM,
            ExternalModules::KEY_LANGUAGE_PROJECT,
            ExternalModules::KEY_VERSION,
            ExternalModules::KEY_ENABLED,
            ExternalModules::KEY_DISCOVERABLE,
            ExternalModules::KEY_USER_ACTIVATE_PERMISSION,
            ExternalModules::KEY_CONFIG_USER_PERMISSION
        ) as $key) {
            if (isset($settings[$key]["config"])) {
                $settings[$key]["config"]["tab"] = "system-reserved-tab";
            }
        }
        // END REMOVE


        // Get tabs and mark main tabs (i.e. those of first-level settings).
        $tabs = self::getConfigTabs($prefix);
        $mainTabsKeys = array( "system-reserved-tab" => null );
        foreach ($settings as $_ => $s) {
            $mainTabsKeys[$s["config"]["tab"]] = null;
        }
        foreach ($tabs as $key => &$tab) {
            $tab["main"] = array_key_exists($key, $mainTabsKeys);
        }
        // Return Ajax response.
        return array(
            "success" => true,
            "settings" => $settings,
            "tabs" => $tabs,
            "prefix" => $prefix,
            "guid" => $guid
        );
    }



    static function getConfigTabs($prefix) {
        $config = ExternalModules::getConfig($prefix);
        $tabs = array(
            "system-reserved-tab" => array (
                "name" => "System",
                "key" => "system-reserved-tab"
            ),
            "module-reserved-tab" => array (
                "name" => "Module",
                "key" => "module-reserved-tab"
            )
        );
        foreach ($config["tabs"] as $tab) {
            if (!empty($tab["key"])) {
                $tabs[$tab["key"]] = $tab;
            }
        }
        return $tabs;
    }


//#region Module Settings Generation

    /**
     * Recursively builds a data structure representing module settings.
     * 
     * @param array $settings The array that holds the result.
     * @param array $instance The current instance at the current level. Start with an empty array.
     * @param array $config The configuration subtree (system_settings or project_settings).
     * @param array $values The configuration values (from getProjectSettingsAsArray or getSystemSettingsAsArray).
     * @param bool $augment When true, additional information will be added to the settings array (counts, config, etc.).
     */
    private static function moduleSettings_build(&$settings, $instance, $config, $values = null, $augment = true) {
        foreach ($config as $c) {
            $key = $c["key"];
            $repeats = $c["repeatable"] == true;
            $sub = isset($c["sub_settings"]);
            $val = $values[$key]["value"];
            foreach ($instance as $i) {
                $val = $val[$i];
            }
            $settings[$key] = array( 
                "count" => $repeats ? count($val) : 1,
                "repeats" => $repeats,
                "hassubs" => $sub
            );
            if ($sub && $repeats) {
                $settings[$key]["sub"] = array();
                if ($values === null) {
                    $val = array (null => null);
                }
                foreach (array_keys($val) as $curInstance) {
                    $settings[$key]["sub"][$curInstance] = array();
                    array_push($instance, $curInstance);
                    self::moduleSettings_build($settings[$key]["sub"][$curInstance], $instance, $c["sub_settings"], $values, $augment);
                    array_pop($instance);
                }
            } 
            else if ($sub) {
                $settings[$key]["sub"][0] = array();
                array_push($instance, 0);
                self::moduleSettings_build($settings[$key]["sub"][0], $instance, $c["sub_settings"], $values, $augment);
                array_pop($instance);
            }
            else {
                $settings[$key]["value"] = $val;
            }
            if ($augment) {
                unset($c["sub_settings"]);
                if (!isset($c["tab"])) {
                    // Supplement tab info.
                    $c["tab"] = "module-reserved-tab";
                }
                $settings[$key]["config"] = $c;
                $settings[$key]["type"] = $c["type"];
                
            }
        } 
    }

    /**
     * Gets the non-repeating, non-subsettings sibling fields in the first level of the given (sub)settings array.
     */
    private static function moduleSettings_getRootFields($settings) {
        $rootFields = array ();
        foreach ($settings as $key => $setting) {
            if (!$setting["repeats"] && !$setting["hassubs"]) {
                $rootFields[] = $key;
            }
        }
        return $rootFields;
    }

    /**
     * Flattens multidimensional arrays.
     */
    private static function moduleSettings_array_flatten($array = null) {
        if (!is_array($array)) {
            $array = func_get_args();
        }
        $result = array();
        foreach ($array as $k => $v) {
            if (is_array($v)) {
                $result = array_merge($result, self::moduleSettings_array_flatten($v));
            } else {
                $result = array_merge($result, array($k => $v));
            }
        }
        return $result;
    }

    /**
     * Extracts (valid) fields used in branching logic or scope.
     */
    private static function moduleSettings_extractFieldFields($config, $validFields) {
        $fields = array();
        if ($config) {
            $getFields = function($arr) use (&$fields, &$getFields, $validFields) {
                foreach ($arr as $k => $v) {
                    if ($k == "field" && in_array($v, $validFields, true)) {
                        $fields[$v] = null;
                    }
                    else if (is_array($v)) {
                        $getFields($v);
                    }
                }
            };
            $getFields($config, $fields);
        }
        return array_keys($fields);
    }

    /**
     * Augments settings with data on dependendies (branching logic, scope).
     */
    private static function moduleSettings_augmentDependencies(&$settings, $path = array(), $validDependencies = array()) {
        $rootFields = self::moduleSettings_getRootFields($settings);
        array_push($validDependencies, $rootFields);
        $valid = self::moduleSettings_array_flatten($validDependencies);
        foreach ($settings as $key => &$setting) {
            $setting["dependencies"]["valid"] = array_filter($valid, function($v) use ($key) { return $v !== $key; });
            $setting["dependencies"]["path"] = array_merge($path, array($key));
            $setting["dependencies"]["dependsOn"] = self::moduleSettings_extractFieldFields($setting["config"]["branchingLogic"], $valid);
            $setting["dependencies"]["scope"] = self::moduleSettings_extractFieldFields($setting["config"]["scope"], $valid);
        }
        foreach ($settings as $key => &$setting) {
            if ($setting["hassubs"]) {
                array_push($path, $key);
                if ($setting["repeats"] == true) {
                    foreach ($setting["sub"] as $_ => &$sub_setting) {
                        self::moduleSettings_augmentDependencies($sub_setting, $path, $validDependencies);
                    }
                }
                else {
                    self::moduleSettings_augmentDependencies($setting["sub"][0], $path, $validDependencies);
                }
                array_pop($path);
            }
        }
    }

    /**
     * Gets a module's project settings.
     * @param string $prefix The unique module prefix.
     * @param int $pid A project id.
     * @param bool $augment When true, the returned data structure will be augemnted with additional information.
     * @return array The module's project settings in the enhanced format.
     */
    static function getEnhancedProjectSettings($prefix, $pid, $augment = true) {
        // TODO: check $pid
        return self::moduleSettings_getSettings($prefix, $pid, "project-settings", $augment);
    }

    /**
     * Gets a module's system settings.
     * @param string $prefix The unique module prefix.
     * @param bool $augment When true, the returned data structure will be augemnted with additional information.
     * @return array The module's system settings in the enhanced format.
     */
    static function getEnhancedSystemSettings($prefix, $augment = true) {
        return self::moduleSettings_getSettings($prefix, null, "system-settings", $augment);
    }

    /**
     * Gets enhanced module settings.
     * @param string $prefix The unique module prefix.
     * @param int|null $pid A project id.
     * @param string $type The type of settings: "project-settings" | "system-settings".
     * @param bool $augment When true, the returned data structure will be augemnted with additional information.
     * @return array Module settings in the enhanced format.
     */
    private static function moduleSettings_getSettings($prefix, $pid = null, $type = "project-settings", $augment = true) {
        // Mangle type (set to system if no pid).
        $type = $pid == null ? "system-settings" : $type;
        // Get data.
        $values = ($type == "project")
            ? ExternalModules::getProjectSettingsAsArray($prefix, $pid, false)
            : ExternalModules::getSystemSettingsAsArray($prefix);
        $config = ExternalModules::getConfig($prefix, null, $pid);
        // Generate.
        $settings = array();
        self::moduleSettings_build($settings, array(), $config[$type], $values, $augment);
        // Augment dependencies.
        if ($augment) {
            self::moduleSettings_augmentDependencies($settings);
            self::moduleSettings_addDepending($settings); // This may not be needed.
        }
        return $settings;
    }


    private static function moduleSettings_gatherDepending($setting, &$depending) {
        foreach($setting["dependencies"]["dependsOn"] as $dependsOn) {
            $depending[$dependsOn][$setting["config"]["key"]] = true;
        }
        if ($setting["hassubs"]) {
            foreach ($setting["sub"] as $subsettings) {
                foreach ($subsettings as $_ => $subsetting) {
                    self::moduleSettings_gatherDepending($subsetting, $depending);
                }
            }
        }
    }

    private static function moduleSettings_setDepending(&$setting, $depending) {
        $setting["dependencies"]["depending"] = array_keys($depending[$setting["config"]["key"]]) ?: array();
        if ($setting["hassubs"]) {
            foreach ($setting["sub"] as &$subsettings) {
                foreach ($subsettings as $_ => &$subsetting) {
                    self::moduleSettings_setDepending($subsetting, $depending);
                }
            }
        }
    }

    private static function moduleSettings_addDepending(&$settings) {
        $depending = array();
        foreach ($settings as $setting) {
            self::moduleSettings_gatherDepending($setting, $depending);
        }
        foreach ($settings as &$setting) {
            self::moduleSettings_setDepending($setting, $depending);
        }
    }

    /**
     * Gets a data structure outlining a module's system and project settings.
     * @param string $prefix The unique module prefix.
     * @return array An array with the settings structure.
     */
    static function getModuleSettingsStructure($prefix) {
        $config = ExternalModules::getConfig($prefix);
        $mss = array(
            "system-settings" => array(),
            "project-settings" => array()
        );
        self::moduleSettings_build($mss["system-settings"], array(), $config["system-settings"]);
        self::moduleSettings_build($mss["project-settings"], array(), $config["project-settings"]);

        return $mss;
    }

//#endregion


}
