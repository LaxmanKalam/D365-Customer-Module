
var BSS_AddToQueue = (function () {
    
     alert("new Add to queue js");
    "use strict";

    var CASE_TABLE = "bss_case";
    var QUEUE_TABLE = "bss_queue";
    var QUEUE_ITEM_TABLE = "bss_queueitem";

    // Entity set names used by Dataverse Web API.
    var CASE_SET = "bss_cases";
    var QUEUE_SET = "bss_queues";

    function showError(message) {
        return Xrm.Navigation.openAlertDialog({
            text: message,
            title: "Add to Queue"
        });
    }

    function normalizeId(id) {
        return (id || "").replace(/[{}]/g, "").toLowerCase();
    }

    function addToQueue(primaryControl) {
        // TEMPORARY TEST: Remove this alert after verifying the button.
        alert("Add to Queue JavaScript triggered successfully!");

        try {
            if (!primaryControl || !primaryControl.data ||
                !primaryControl.data.entity) {
                return showError("Case form context is unavailable.");
            }

            var entityName = primaryControl.data.entity.getEntityName();

            if (entityName !== CASE_TABLE) {
                return showError("This action is available only on a Case record.");
            }

            var caseId = normalizeId(
                primaryControl.data.entity.getId()
            );

            if (!caseId) {
                return showError("Save the Case before adding it to a Queue.");
            }

            Xrm.Utility.lookupObjects({
                allowMultiSelect: false,
                entityTypes: [QUEUE_TABLE],
                defaultEntityType: QUEUE_TABLE
            }).then(function (selectedQueues) {
                if (!selectedQueues || selectedQueues.length === 0) {
                    return;
                }

                var queue = selectedQueues[0];
                var queueId = normalizeId(queue.id);

                return Xrm.WebApi.retrieveRecord(
                    QUEUE_TABLE,
                    queueId,
                    "?$select=bss_name,statecode"
                ).then(function (queueRecord) {
                    if (queueRecord.statecode !== 0) {
                        throw new Error(
                            "The selected Queue is inactive. Select an active Queue."
                        );
                    }
//
                    return Xrm.WebApi.retrieveRecord(
                        CASE_TABLE,
                        caseId,
                        "?$select=bss_casetitle,bss_casenumber,bss_casetype"
                    ).then(function (caseRecord) {
                        var title = caseRecord.bss_casetitle ||
                                    caseRecord.bss_casenumber ||
                                    "Case";

                        var filter =
                            "?$select=bss_queueitemid" +
                            "&$filter=_bss_case_value eq " + caseId +
                            " and _bss_queue_value eq " + queueId +
                            " and statecode eq 0";

                        return Xrm.WebApi.retrieveMultipleRecords(
                            QUEUE_ITEM_TABLE,
                            filter
                        ).then(function (existingItems) {
                            if (existingItems.entities.length > 0) {
                                return showError(
                                    "This Case is already in the selected Queue."
                                );
                            }

                            var item = {
                                bss_title: title,
                                bss_enteredqueueon:
                                    new Date().toISOString(),
//
                                        bss_type: 760820017,
                                        bss_case_queue_item_type: caseRecord.bss_casetype,
//
                                "bss_case@odata.bind":
                                    "/" + CASE_SET + "(" + caseId + ")",
                                "bss_queue@odata.bind":
                                    "/" + QUEUE_SET + "(" + queueId + ")"
                            };

                            return Xrm.WebApi.createRecord(
                                QUEUE_ITEM_TABLE,
                                item
                            ).then(function () {
                                return Xrm.Navigation.openAlertDialog({
                                    title: "Add to Queue",
                                    text: "Case added to Queue successfully."
                                });
                            });
                        });
                    });
                });
            }).catch(function (error) {
                console.error("Add to Queue failed:", error);

                showError(
                    error.message ||
                    "An unexpected error occurred while adding the Case to Queue."
                );
            });
        } catch (error) {
            console.error("Add to Queue initialization failed:", error);

            showError(
                error.message || "Unable to start the Add to Queue operation."
            );
        }
    }

    return {
        addToQueue: addToQueue
    };
})();