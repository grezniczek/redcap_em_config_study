// @ts-check
;(function() {
// @ts-ignore
if (typeof window.ExternalModules == 'undefined') {
    /** @type {ExternalModules} */
    var EM = {}
    // @ts-ignore
    window.ExternalModules = EM
}
function debugLog() {
    if (EM.emcDebug) {
        for (var i = 0; i < arguments.length; i++)
            console.log(arguments[i])
    }
}

/**
 * Shows the (static) initialization error and logs more details to the console.
 * @param {string} msg The error message.
 */
function initError(msg) {
    modal.find('.emc-loading').hide()
    modal.find('.emc-initerror').show()
    console.warn(msg);
}

/**
 * Builds the dialog.
 * @param {string} prefix
 * @param {string} guid
 */
function buildDialog(prefix, guid) {
    // Only ever build one dialog!
    modal = $('#emcModal')
    if (modal.attr('data-emc-prefix') !== prefix) return;
    if (modal.attr('data-emc-guid') !== guid) return;

    // Tabs.
    Object.keys(settings.tabs).forEach(function(tabKey) {
        var tabInfo = settings.tabs[tabKey]
        if (tabInfo.main) {
            // Tab
            var $tab = getTemplate('emcTabItem')
            var $a = $tab.find('a')
            $a.attr('id', 'emcMainTab-' + tabKey)
            $a.attr('href', '#emcMainPanel-' + tabKey)
            $a.attr('aria-controls', '#emcMainPanel-' + tabKey)
            $tab.find('.emc-tab-link-text').html(tabInfo.name)
            if (tabInfo['help-text'] || tabInfo['help-url']) {
                $tab.find('.emc-tab-help').attr('data-emc-tab-help', tabKey)
            }
            else {
                $tab.find('.emc-tab-help').remove()
            }
            $('ul.emc-tabs').append($tab)
            // Panel
            var $panel = getTemplate('emcTabPanel')
            $panel.attr('id', 'emcMainPanel-' + tabKey)
            $panel.attr('aria-labelledby', 'emcMainTab-' + tabKey)
            $('.emc-tab-container').append($panel)
        }
    })

    // Root-level fields.
    Object.keys(settings.current).forEach(function(key) {
        /** @type {ModuleSetting} Module setting info */
        var setting = settings.current[key]
        var id = 'emcSetting-' + key
        // Get outer template.
        var $f = getTemplate('emcSetting');
        // Add control template.
        var $control = getSettingTemplate(setting.config)
        $control.find('.emc-setting-labeltarget').attr('id', id)
        // Configure.
        $f.find('.emc-setting-field').append($control)
        $f.find('.emc-setting-label').attr('for', id)
        $f.find('.emc-setting-label-text').html(setting.config.name)
        if (setting.config['help-text'] || setting.config['help-url']) {
            $f.find('.emc-setting-help').attr('data-emc-setting-help', key)
        }
        else {
            $f.find('.emc-setting-help').remove()
        }
        $f.find('.emc-setting-description').html(setting.config.description)
        // Append to the correct tab.
        $('#emcMainPanel-' + setting.config.tab).append($f)
    })

    // Empty tabs? Show one.
    var activated = false
    var $p = $('.emc-tab-panel').first()
    while ($p.length) {
        if ($p.children().length) {
            if (!activated) {
                $('#' + $p.attr('aria-labelledby')).tab('show')
                activated = true
            }
        }
        else {
            $p.append(getTemplate('emcTabEmpty'))
        }
        $p = $p.next('.emc-tab-panel')
    }
    if (!activated) {
         $('.emc-tab-link:first').tab('show')
    }
    // Hide blocking overlay and remove init-only items.
    modal.find('.emc-default-body').show()
    modal.find('.emc-loading').hide()
    modal.find('.emc-overlay').fadeOut(300, function() {
        modal.find('.emc-modal-wrapper').children().appendTo(modal.find('.modal-content'))
        modal.find('.emc-initonly').remove()
    })
    finalize()
}

function finalize() {
    // Initialize textarea autosizing
    // @ts-ignore
    $('.textarea-autosize').textareaAutoSize();
    // Hide blocking overlay and remove init-only items.
    modal.find('.emc-default-body').show()
    modal.find('.emc-loading').hide()
    modal.find('.emc-overlay').fadeOut(300, function() {
        modal.find('.emc-modal-wrapper').children().appendTo(modal.find('.modal-content'))
        modal.find('.emc-initonly').remove()
    })
}

/** @type {JQuery} */
var modal = null
/** @type {ModuleSettingsInfos} Module Settings */
var settings = {}
/** @type {ModuleInfo} Module Info */
var module = {}




/**
     * @param {JQuery<HTMLElement>} $template
     * @param {string} name
     */
function insertPart($template, name) {
    var $part = getTemplate(name)
    var $target = $template.find('.' + $part.attr('data-emc-target'))
    var mode = $part.attr('data-emc-insert')
    switch (mode) {
        case 'prepend': $target.prepend($part); break;
        case 'append': $target.append($part); break;
        case 'before': $target.before($part); break;
        case 'after': $target.after($part); break;
    }
}

/**
 * Gets a template by type.
 * @param {SettingConfig} config The type of the setting (as in config.json).
 * @returns {JQuery} The jQuery representation of the template's content.
 */
function getSettingTemplate(config) {
    // Assemble templates.
    switch (config.type) {
        case 'checkbox': return getTemplate('emcSwitch')
        case 'text':
        case 'email': {
            var $tpl = getTemplate('emcTextbox')
            if (config.repeatable) {
                insertPart($tpl, 'emcTextbox-repeatable')
            }
            if (config.type == 'email') {
                insertPart($tpl, 'emcTextbox-email')
            }
            return $tpl
        }
        case 'textarea': 
        case 'json': {
            var $tpl = getTemplate('emcTextarea')
            if (config.repeatable) {
                insertPart($tpl, 'emcTextarea-repeatable')
            }
            if (config.type == 'json') {
                insertPart($tpl, 'emcTextarea-json')
            }
            return $tpl
        }
    }
    return getTemplate('emcNotImplemented')
}


/**
 * Gets a template by name.
 * @param {string} name The name of the template (i.e. value of the data-emc attribute).
 * @returns {JQuery} The jQuery representation of the template's content.
 */
function getTemplate(name) {
    // @ts-ignore
    return $(document.querySelector('template[data-emc=' + name + ']').content.firstElementChild.cloneNode(true))
}

/** 
 * Callback on success. 
 * @callback onSuccessCallback 
 * @param {string} prefix 
 * @param {string} guid 
 */
/**
 * Callback on error.
 * @callback onErrorCallback
 * @param {string} errorMessage
 */
/**
 * Gets settings from server. When done, calls the callback.
 * @param {string} prefix
 * @param {string} guid
 * @param {onSuccessCallback} onSuccess 
 * @param {onErrorCallback} onError 
 */
function getSettings(prefix, guid, onSuccess, onError) {
    $.ajax({
        method: 'POST', 
        url: EM.emcAjax.get,
        data: 'verification=' + EM.emcAjax.verification + '&action=get-settings&prefix=' + prefix,
        dataType: "json",
        success: function(data) {
            debugLog(data)
            if (data.success) {
                EM.emcAjax.verification = data.verification
                var json = JSON.stringify(data.settings)
                settings.original = JSON.parse(json)
                // @ts-ignore
                settings.originalHash = objectHash(settings.original)
                settings.current = JSON.parse(json)
                settings.tabs = data.tabs
                onSuccess(prefix, guid)
            }
            else {
                onError(data.error)
            }
        },
        error: function(jqXHR, error) {
            debugLog('Ajax Error:', error, jqXHR)
            onError(error)
        }
    })
}
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}
// Shows the enhanced module configuration dialog.
EM.showEnhancedConfig = function (prefix, pid = null) {
    // Store arguments and get additional data.
    settings = {
        original: null,
        originalHash: null,
        current: null,
        tabs: null
    }
    module = {
        prefix: prefix,
        version: EM.versionsByPrefixJSON[prefix],
        name: EM.configsByPrefixJSON[prefix].name,
        pid: pid
    }
    // Remove any previous modals.
    $('#emcModal').remove()
    // Clone the modal template.
    modal = getTemplate('emcModal')
    var guid = uuidv4()
    modal.attr('data-emc-guid', guid)
    modal.attr('data-emc-prefix', prefix)
    debugLog('Created modal ' + guid)
    $('body').append(modal)
    // Setup the modal for the given module
    modal.find('.emc-module-name').text(module.name)
    modal.find('.emc-module-version').text(module.version)
    modal.find('.modal-body').hide()
    modal.find('.emc-initerror').hide()
    modal.find('.emc-initializing').show()
    modal.on('hidden.bs.modal', function () {
        // Destroy on closing. We always rebuild.
        debugLog('Destroyed modal ' + modal.attr('data-emc-guid'))
        modal.remove()
    })
    // Show the modal.
    modal.modal('show')
    // Get settings and build.
    getSettings(prefix, guid, buildDialog, initError)
}


// TODO: Remove - this is for development only!
$(function() {
    if (EM.PID) {
        EM.showEnhancedConfig('global_piping', 40)
    }
    else {
        EM.showEnhancedConfig('redcap_em_config_study', null)
    }
})
})();