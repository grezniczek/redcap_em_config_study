<?php

$this->includeScript("enhanced-module-config/js/3rd-party/object_hash.js");
$this->includeScript("enhanced-module-config/js/3rd-party/autosize.js");
$this->includeScript("enhanced-module-config/js/3rd-party/FileSaver.min.js");
$this->includeScript("enhanced-module-config/js/enhanced-module-config.js");
$this->includeCSS("enhanced-module-config/css/enhanced-module-config.css");

$debug = true;

global $Proj;
$emc_pid = $Proj->project_id;
$emc_projectName = $Proj->project["app_title"];

// Ajax Setup.
$crypto = \DE\RUB\ConfigurationDesignStudyExternalModule\Crypto::init();
$verificationPayload = $crypto->encrypt(array (
    "type" => $emc_pid === null ? "system-settings" : "project-settings",
    "userid" => $GLOBALS["userid"],
    "pid" => $emc_pid,
    "timestamp" => time()
));
$ajax = array (
    "verification" => $verificationPayload,
    "get" => $this->framework->getUrl("enhanced-module-config/ajax/get-settings.php"),
    "save" => $this->framework->getUrl("enhanced-module-config/ajax/save-settings.php")
);

?>
<script>ExternalModules.emcAjax = <?=json_encode($ajax)?>; ExternalModules.emcDebug = <?=json_encode($debug)?></script>
<!-- EMC Templates -->
<template data-emc="emcTabItem">
    <li class="nav-item">
        <a class="nav-link emc-tab-link" data-toggle="tab" href="" role="tab" aria-controls="" aria-selected="">
            <span class="emc-tab-link-text"></span>
            <i data-emc-tab-help class="emc-tab-help fas fa-question-circle fa-sm"></i>
        </a>
    </li>
</template>


<template data-emc="emcTabPanel">
    <div class="tab-pane fade emc-tab-panel" role="tabpanel" aria-labelledby=""></div>
</template>

<template data-emc="emcTabEmpty">
    <div class="emc-nosettings">
        This tab contains no settings.
    </div>
</template>


<template data-emc="emcModal">
    <div id="emcModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="emcTitle" aria-hidden="true" data-backdrop="static" data-keyboard="false">
        <div class="modal-dialog modal-lg modal-xl modal-dialog-scrollable" role="document">
            <div class="modal-content">
                <div class="modal-header emc-modal-header">
                    <h5 class="modal-title" id="emcTitle">
                        <?=$this->tt("emc_title_moduleconfig")?> <span class="emc-module-name">Name</span>
                        <div class="badge badge-secondary emc-module-version"></div>
                        <?php if ($emc_pid == null): ?>
                        <div class="emc-system-info">
                            <?=$this->tt("emc_title_system")?>
                        </div>
                        <?php else: ?>
                        <div class="emc-project-info">
                            <?=$this->tt("emc_title_project")?>
                            <span class="badge badge-info emc-project-id"><?=$emc_pid?></span> &ndash;
                            <span class="emc-project-name"><?=$emc_projectName?></span>
                        </div>
                        <?php endif; ?>
                    </h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="<?=$this->tt("emc_close")?>">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="emc-modal-wrapper">
                    <!-- Loading -->
                    <div class="modal-body emc-overlay emc-initializing emc-initonly"></div>
                    <div class="emc-initonly">
                        <div class="modal-body emc-modal-body emc-loading emc-initializing">
                            <div class="fa-5x">
                                <i class="fas fa-cog fa-spin"></i>
                            </div>
                        </div>
                        <div class="modal-body emc-modal-body emc-initerror">
                            <div>
                                <p><?=$this->tt("emc_init_failed")?></p>
                                <button type="button" data-dismiss="modal" class="btn btn-primary btn-md"><?=$this->tt("emc_close")?></button>
                            </div>
                        </div>
                    </div>
                    <!-- Default Modal Body -->
                    <div class="modal-body emc-modal-body emc-default-body">
                        <!-- Main Tabs (holds emcTabItem) -->
                        <ul class="nav nav-tabs emc-tabs" role="tablist"></ul>
                        <!-- Tab Container (holds emcTabPanel) -->
                        <div class="tab-content emc-tab-container"></div>
                    </div>

                    <!-- Modal Footer -->
                    <div class="modal-footer">
                        <div>
                            <div class="import-export"> 
                                <button type="button" data-emc-action="import" class="btn btn-light btn-sm">
                                    <i class="fas fa-upload"></i> Import
                                </button>
                                <button type="button" data-emc-action="export" class="btn btn-light btn-sm">
                                    <i class="fas fa-download"></i> Export
                                </button>
                                <button type="button" data-emc-action="clear" class="btn btn-danger btn-sm">
                                    <i class="fas fa-trash"></i> Clear all
                                </button>
                                </div>
                            <button type="button" data-dismiss="modal" data-emc-action="cancel" class="btn btn-secondary btn-sm">
                                Cancel
                            </button>
                            <button type="button" data-emc-action="save" class="btn btn-primary btn-sm">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div><!-- emc-modal-wrapper -->
            </div>
        </div>
    </div>
</template>

<template data-emc="emcSetting">
    <div class="form-group emc-form-group">
        <label class="emc-setting-label" for="">
            <span class="emc-setting-label-text"></span>
            <a href="javascript:;" class="small emc-setting-help" data-emc-setting-help><i class="fas fa-question-circle"></i></a>
        </label>
        <div class="emc-setting-description"></div>
        <div class="emc-setting-field"></div>
    </div>
</template>

<template data-emc="emcNotImplemented">
    <div>Not implemented.</div>
</template>

<template data-emc="emcSwitch">
    <div class="custom-control custom-switch switch-lg emc-switch-control">
        <input type="checkbox" class="custom-control-input emc-setting-labeltarget" id="">
        <label class="custom-control-label emc-setting-label" for=""></label>
    </div>
</template>

<template data-emc="emcTextbox">
    <div class="input-group mb-3">
        <input type="text" class="form-control" placeholder="" aria-labelledby="" id="">
        <div class="input-group-append">
            <span class="input-group-text">
                <button type="button" class="close emc-clear" aria-label="<?=$this->tt("emc_clear")?>">
                    <span aria-hidden="true">&times;</span>
                </button>
            </span>
        </div>
        <!-- TODO: valiation -->
    </div>
</template>

<template data-emc="emcRepeatableTextbox">
    <div class="input-group mb-3">
        <input type="text" class="form-control" placeholder="" aria-labelledby="" id="">
        <div class="input-group-append">
            <span class="input-group-text">
                <button class="btn btn-success btn-xs" type="button"><i class="fas fa-plus"></i></i></button>
            </span>
            <span class="input-group-text">
                <button type="button" class="close emc-clear" aria-label="<?=$this->tt("emc_clear")?>">
                    <span aria-hidden="true">&times;</span>
                </button>
            </span>
        </div>
        <!-- TODO: valiation -->
    </div>
</template>

<template data-emc="emcTextarea">
    <div class="input-group emc-textarea-control">
        <textarea rows="1" class="form-control textarea-autosize emc-setting-labeltarget" aria-labelledby="" id=""></textarea>
        <div class="input-group-prepend">
            <span class="input-group-text emc-vtop">
                <button type="button" class="close emc-clear" aria-label="<?=$this->tt("emc_clear")?>">
                    <span aria-hidden="true">&times;</span>
                </button>
            </span>
        </div>
        <!-- TODO: valiation -->
    </div>
</template>

