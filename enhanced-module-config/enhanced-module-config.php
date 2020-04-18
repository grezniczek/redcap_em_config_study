<?php

$this->includeScript("enhanced-module-config/js/enhanced-module-config.js");
$this->includeCSS("enhanced-module-config/css/enhanced-module-config.css");

global $Proj;
$emc_pid = $Proj->project_id;
$emc_projectName = $Proj->project["app_title"];

?>
<!-- Enhanced External Module Configuration Modal -->
<div
    class="modal fade"
    id="emcModal"
    tabindex="-1"
    role="dialog"
    aria-labelledby="emcTitle"
    aria-hidden="true"
    data-backdrop="static"
    data-keyboard="false"
>
    <div
        class="modal-dialog modal-lg modal-xl modal-dialog-scrollable"
        role="document"
    >
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="emcTitle">
                    <?=$this->tt("emc_title_moduleconfig")?> <span class="emc-module-name">Name</span>
                    <div class="emc-project-info" <?=$emc_pid === null ? "hidden" : ""?>>
                        <?=$this->tt("emc_title_project")?>
                        <span class="badge badge-pill badge-secondary emc-project-id"><?=$emc_pid?></span> &ndash;
                        <span class="emc-project-name"><?=$emc_projectName?></span>
                    </div>
                    <div class="emc-system-info" <?=$emc_pid === null ? "" : "hidden"?>>
                        <?=$this->tt("emc_title_system")?>
                    </div>
                </h5>
                <button
                    type="button"
                    class="close"
                    data-dismiss="modal"
                    aria-label="Close"
                >
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            
            <!-- Loading -->
            <div class="emc-modal-wrapper">
            <div class="modal-body emc-overlay"></div>
            <div class="modal-body emc-loading" style="min-height: 200px;">
                <div class="fa-5x">
                    <i class="fas fa-cog fa-spin"></i>
                </div>
            </div>

            <!-- Default Modal Body -->
            <div class="modal-body" hidden id="emcDefaultBody" style="min-height: 200px;">

                <!-- Tabs for settings -->
                <ul class="nav nav-tabs" id="settings" role="tablist">
                    <li class="nav-item">
                        <a
                            class="nav-link active"
                            id="system-tab"
                            data-toggle="tab"
                            href="#system"
                            role="tab"
                            aria-controls="system"
                            aria-selected="true"
                            >System</a
                        >
                    </li>
                    <li class="nav-item">
                        <a
                            class="nav-link"
                            id="module-1-tab"
                            data-toggle="tab"
                            href="#module-1"
                            role="tab"
                            aria-controls="module-1"
                            aria-selected="false"
                            >General</a
                        >
                    </li>
                    <li class="nav-item">
                        <a
                            class="nav-link"
                            id="module-2-tab"
                            data-toggle="tab"
                            href="#module-2"
                            role="tab"
                            aria-controls="module-2"
                            aria-selected="false"
                            >Others</a
                        >
                    </li>
                </ul>

                <!-- Tabs -->

                <div class="tab-content" id="configTabs">
                    <!-- Tab: System -->
                    <div
                        class="tab-pane fade show active"
                        id="system"
                        role="tabpanel"
                        aria-labelledby="system-tab"
                    >
                        <div class="form-group">
                            <div class="settings-label">
                                <label for="reserved-language-project"
                                    >Language file</label
                                >
                            </div>
                            <div class="settings-description">
                                Language file to use for this module in
                                this project (leave blank for system
                                setting to apply).
                            </div>
                            <div class="settings-field">
                                <select
                                    class="form-control form-control-sm"
                                    id="reserved-language-project"
                                >
                                    <option value=""></option>
                                    <option value="English"
                                        >English</option
                                    >
                                    <option selected="" value="Deutsch"
                                        >Deutsch</option
                                    >
                                </select>
                            </div>
                        </div>
                        <div class="settings-description">
                            Please contact the REDCap Administrator
                            regarding availability of other languages or
                            customization of language files.
                        </div>

                        <div class="system-history-container">
                            <button class="btn btn-light btn-sm" onclick="showHistory()">
                                <i class="fas fa-history"></i> Settings History
                            </button>
                            <div id="system-history-list" hidden>
                                <table class="table table-striped table-sm">
                                    <tr>
                                        <th scope="col">Date</th>
                                        <th scope="col">User ID</th>
                                        <th scope="col">Module Version</th>
                                        <th scope="col">Action</th>
                                    </tr>
                                    <tr>
                                        <td>2019-10-22 14:22</td>
                                        <td>rezniczek</td>
                                        <td>2.1.3</td>
                                        <td>
                                            <a href="#">Restore</a>
                                            &nbsp;&nbsp;|&nbsp;&nbsp;
                                            <a href="#">Export</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>2019-09-17 08:03</td>
                                        <td>macever</td>
                                        <td>2.0.3</i></td>
                                        <td>
                                            <a href="#">Restore</a>
                                            &nbsp;&nbsp;|&nbsp;&nbsp;
                                            <a href="#">Export</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>2019-06-03 18:44</td>
                                        <td>taylor</td>
                                        <td>1.2.1  <i class="fas fa-exclamation-triangle text-warning"></i></td>
                                        <td>
                                            <a href="#" class="text-danger">Restore</a>
                                            &nbsp;&nbsp;|&nbsp;&nbsp;
                                            <a href="#">Export</a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </div>



                    </div><!-- Tab: System -->

                    <!-- Tab: General -->
                    <div
                        class="tab-pane fade"
                        id="module-1"
                        role="tabpanel"
                        aria-labelledby="module-1-tab"
                    >
                        <div class="form-group">
                            <div class="settings-label">
                                <label for="general-1"
                                    >A general project-specific
                                    setting</label
                                >
                                <div class="settings-help">
                                    <button
                                        class="btn btn-light btn-sm"
                                        data-toggle="modal"
                                        data-target="#general-1-help"
                                    >
                                        <i
                                            class="fas fa-question-circle"
                                        ></i>
                                    </button>
                                </div>
                            </div>
                            <div class="settings-description">
                                This is the description for this first
                                very general setting. Just enter any
                                value you want. It won't matter anyway.
                            </div>
                            <div class="settings-field">
                                <input
                                    type="text"
                                    class="form-control form-control-sm"
                                    id="general-1"
                                />
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="settings-label">
                                <label for="general-2"
                                    >A repeatable setting with
                                    subsettings</label
                                >
                                <div class="settings-help">
                                    <button
                                        class="btn btn-light btn-sm"
                                        data-toggle="modal"
                                        data-target="#general-2-help"
                                    >
                                        <i
                                            class="fas fa-question-circle"
                                        ></i>
                                    </button>
                                </div>
                            </div>
                            <div class="settings-description">
                                This is the description for this second
                                very general setting. It is repeatable.
                                You can add and remove items.
                            </div>
                            <div class="repeatable-list">
                                <button class="btn btn-sm btn-success">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button class="btn btn-sm btn-light">
                                    1
                                </button>
                                <button class="btn btn-sm btn-primary">
                                    2
                                </button>
                                <button class="btn btn-sm btn-light">
                                    3
                                </button>
                            </div>
                            <table class="repeatable-container">
                                <tr>
                                    <td
                                        class="repeatable-side"
                                        rowspan="2"
                                    >
                                        <a href="#" class="text-danger"><i class="far fa-trash-alt"></i></a>
                                    </td>
                                    <td class="repeatable-item">
                                        <div class="form-group">
                                            <div
                                                class="subsettings-label"
                                            >
                                                <label for="sub-1"
                                                    >The first
                                                    subsetting</label
                                                >
                                            </div>
                                            <div
                                                class="settings-description"
                                            >
                                                A short description.
                                            </div>
                                            <div class="settings-field">
                                                <input
                                                    type="text"
                                                    class="form-control form-control-sm"
                                                    id="sub-1"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="repeatable-item">
                                        <div class="form-group">
                                            <div
                                                class="subsettings-label"
                                            >
                                                <label for="sub-2"
                                                    >The second
                                                    subsetting</label
                                                >
                                            </div>
                                            <div
                                                class="settings-description"
                                            >
                                                A short description.
                                            </div>
                                            <div class="settings-field">
                                                <input
                                                    type="text"
                                                    class="form-control form-control-sm"
                                                    id="sub-2"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </div>


                        <div class="form-group">
                                <div class="settings-label">
                                    <label for="general-1"
                                        >Another repeatable setting (without subsettings)</label
                                    >
                                </div>
                                <div class="settings-description">
                                    This is the description for a single repeatable setting. Add/remove rows at will.
                                </div>
                                <table class="repeatable-container">
                                    <tr>
                                        <td class="single-repeatable-side">
                                            <a href="#" class="text-danger"><i class="far fa-trash-alt"></i></a>
                                        </td>
                                        <td class="repeatable-item">
                                            <div class="form-group">
                                                <div class="settings-field">
                                                    <input
                                                        type="text"
                                                        class="form-control form-control-sm"
                                                        id="sub-1"
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="single-repeatable-side">
                                            <a href="#" class="text-danger"><i class="far fa-trash-alt"></i></a>
                                        </td>
                                        <td class="repeatable-item">
                                            <div class="form-group">
                                                <div class="settings-field">
                                                    <input
                                                        type="text"
                                                        class="form-control form-control-sm"
                                                        id="sub-2"
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="single-repeatable-side">
                                            <a href="#" class="text-success single-repeatable-add"><i class="fas fa-plus-square"></i></a>
                                        </td>
                                        <td class="repeatable-item">
                                            <i class="settings-description">Click <i class="fas fa-plus-square"></i> to add more items.</i>
                                        </td>
                                    </tr>
                                    </table>

                            </div>


                        <div class="form-group">
                            <div class="settings-label">
                                <label for="general-1"
                                    >Another general project-specific
                                    setting</label
                                >
                                <div class="settings-help">
                                    <button
                                        class="btn btn-light btn-sm"
                                        data-toggle="modal"
                                        data-target="#general-3-help"
                                    >
                                        <i
                                            class="fas fa-question-circle"
                                        ></i>
                                    </button>
                                </div>
                            </div>
                            <div class="settings-description">
                                This is the description for this first
                                very general setting. Just enter any
                                value you want. It won't matter anyway.
                            </div>
                            <div class="settings-field">
                                <input
                                    type="text"
                                    class="form-control form-control-sm"
                                    id="general-3"
                                />
                            </div>
                        </div>
                    </div><!-- Tab: General -->

                    <!-- Tab: Others -->
                    <div
                        class="tab-pane fade"
                        id="module-2"
                        role="tabpanel"
                        aria-labelledby="module-2-tab"
                    >
                        <div class="form-group">
                            <div class="settings-label">
                                <label for="general-1"
                                    >A general project-specific setting
                                    <a
                                        href="#"
                                        class="small"
                                        data-toggle="modal"
                                        data-target="#general-1-help"
                                        ><i
                                            class="fas fa-question-circle"
                                        ></i></a
                                ></label>
                            </div>
                            <div class="settings-description">
                                This is the description for this first
                                very general setting. Just enter any
                                value you want. It won't matter anyway.
                            </div>
                            <div class="settings-field">
                                <input
                                    type="text"
                                    class="form-control form-control-sm"
                                    id="general-1"
                                />
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="settings-label">
                                <label for="general-2"
                                    >A repeatable setting with
                                    subsettings
                                    <a
                                        href="#"
                                        class="small"
                                        data-toggle="modal"
                                        data-target="#general-2-help"
                                        ><i
                                            class="fas fa-question-circle"
                                        ></i></a
                                ></label>
                            </div>
                            <div class="settings-description">
                                This is the description for this second
                                very general setting. It is repeatable.
                                You can add and remove items. Try to edit item group <b>2</b>, it's the only one wired up in this demo.
                                If you are editing it, click <b>Others</b> to go back one level.
                            </div>
                            <div class="repeatable-list">
                                <button class="btn btn-sm btn-success">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button class="btn btn-sm btn-secondary">
                                    1
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="showBody('editGroup2')">
                                    2
                                </button>
                                <button class="btn btn-sm btn-secondary">
                                    3
                                </button>
                            </div>
                            <div class="settings-description">
                                <i
                                    >Click <i class="fas fa-plus-square"></i> to add, or a number to edit
                                    a subsettings group.</i
                                >
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="settings-label">
                                <label for="general-1"
                                    >Another repeatable setting (without subsettings)</label
                                >
                            </div>
                            <div class="settings-description">
                                This is the description for a single repeatable setting. To edit, add, or remove 'rows', click on edit.
                            </div>
                            <div class="repeatable-list single-repeatable-edit">
                                <button class="btn btn-sm btn-success" onclick="showBody('edit-single-repeatable')">
                                    <i class="fas fa-pen"></i>
                                </button>
                                <i class="settings-description">There are currently</i> <span class="badge badge-primary badge-secondary">2</span> <i class="settings-description">items.</i>
                            </div>
                        </div>

                        <div class="form-group">
                                <label
                                    class="settings-label"
                                    for="reserved-language-project"
                                    >Some other setting</label
                                >
                                <div class="settings-description">
                                    This is a checkbox. Turn it on or off.
                                    Have fun. This has no real function.
                                </div>
                                <div class="settings-field">
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-primary btn-toggle inactive"
                                        data-toggle="button"
                                        aria-pressed="true"
                                        autocomplete="off"
                                    >
                                        <div class="handle"></div>
                                    </button>
                                </div>
                            </div>

                    </div><!-- Tab: Others -->
                </div><!-- Tab Content -->
            </div><!-- Default Modal Body -->


            <!-- Modal body for editing subsettings groups -->
            <div class="modal-body" hidden id="editGroup2">
                <div class="subsettings-edit-crumbs">
                    <a href="#" onclick="showBody('emcDefaultBody')">Others</a> &gt; 
                    <span class="badge badge-primary">2</span> 
                    <b>A repeatable setting with subsettings</b>
                    <a href="#" class="small" data-toggle="modal" data-target="#general-2-help"><i class="fas fa-question-circle"></i></a>
                    <div class="settings-description">
                            This is the description for this second
                            very general setting. It is repeatable.
                            You can add and remove items. Try to edit item group <b>2</b>, it's the only one wired up in this demo. If you are editing it, click <b>Others</b> to go back one level.
                    </div>
                    <div class="repeatable-list">
                        <button class="btn btn-sm btn-danger">
                                <i class="far fa-trash-alt"></i>
                        </button> &mdash;
                        <button class="btn btn-sm btn-secondary">
                            1
                        </button>
                        <button class="btn btn-sm btn-light disabled">
                            2
                        </button>
                        <button class="btn btn-sm btn-secondary">
                            3
                        </button>
                        <button class="btn btn-sm btn-success">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="subsettings-edit">
                    <div class="form-group">
                        <div
                            class="subsettings-label"
                        >
                            <label for="sub-1"
                                >The first
                                subsetting</label
                            >
                        </div>
                        <div
                            class="settings-description"
                        >
                            A short description.
                        </div>
                        <div class="settings-field">
                            <input
                                type="text"
                                class="form-control form-control-sm"
                                id="sub-1"
                            />
                        </div>
                    </div>
                    <div class="form-group">
                        <div
                            class="subsettings-label"
                        >
                            <label for="sub-2"
                                >The second
                                subsetting</label
                            >
                        </div>
                        <div
                            class="settings-description"
                        >
                            A short description.
                        </div>
                        <div class="settings-field">
                            <input
                                type="text"
                                class="form-control form-control-sm"
                                id="sub-2"
                            />
                        </div>
                    </div>
                </div>
            </div><!-- Modal body for editing subsettings groups -->

            <!-- Modal body for editing single repeats -->
            <div class="modal-body" hidden id="edit-single-repeatable">
                <div class="subsettings-edit-crumbs">
                    <a href="#" onclick="showBody('emcDefaultBody')">Others</a> &gt; 
                    <b>Another repeatable setting (without subsettings)</b>
                    <div class="settings-description">
                            This is the description for a single repeatable setting. To edit, add, or remove 'rows', click on edit.
                    </div>
                </div>

                <table class="repeatable-container">
                    <tr>
                        <td class="single-repeatable-side">
                            <a href="#" class="text-danger"><i class="far fa-trash-alt"></i></a>
                        </td>
                        <td class="repeatable-item">
                            <div class="form-group">
                                <div class="settings-field">
                                    <input
                                        type="text"
                                        class="form-control form-control-sm"
                                        id="sub-1"
                                    />
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="single-repeatable-side">
                            <a href="#" class="text-danger"><i class="far fa-trash-alt"></i></a>
                        </td>
                        <td class="repeatable-item">
                            <div class="form-group">
                                <div class="settings-field">
                                    <input
                                        type="text"
                                        class="form-control form-control-sm"
                                        id="sub-2"
                                    />
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="single-repeatable-side">
                            <a href="#" class="text-success single-repeatable-add"><i class="fas fa-plus-square"></i></a>
                        </td>
                        <td class="repeatable-item">
                            <i class="settings-description">Click <i class="fas fa-plus-square"></i> to add more items.</i>
                        </td>
                    </tr>
                </table>

            </div><!-- Modal body for editing single repeats -->




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
            </div><!-- Modal Footer -->
            </div>
        </div>
    </div>
</div>
