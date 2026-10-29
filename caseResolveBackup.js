
var BSS = window.BSS || {};

BSS.ResolveCase = (function () {
    "use strict";
    alert("Resolve Case");

    var ACTIVITY_TABLES = [
        "task",
        "phonecall",
        "email",
        "appointment"
    ];

    async function getOpenActivityCount(caseId) {
        var count = 0;

        for (var i = 0; i < ACTIVITY_TABLES.length; i++) {
            var table = ACTIVITY_TABLES[i];

            var query =
                "?$select=activityid" +
                "&$filter=_regardingobjectid_value eq " + caseId +
                " and statecode eq 0";

            var result = await Xrm.WebApi.retrieveMultipleRecords(
                table,
                query
            );

            count += result.entities.length;

            while (result.nextLink) {
                var nextPage = await Xrm.WebApi.retrieveMultipleRecords(
                    table,
                    result.nextLink
                );

                count += nextPage.entities.length;
                result.nextLink = nextPage.nextLink;
            }
        }

        return count;
    }

    async function resolve(primaryControl) {
        var formContext = primaryControl;

        if (!formContext || !formContext.data ||
            !formContext.data.entity) {
            await Xrm.Navigation.openAlertDialog({
                text: "Unable to access the Case form."
            });
            return;
        }

        var caseId = formContext.data.entity.getId();

        if (!caseId) {
            await Xrm.Navigation.openAlertDialog({
                text: "Please save the Case before resolving it."
            });
            return;
        }

        caseId = caseId.replace(/[{}]/g, "");

        // var status = formContext.getAttribute("bss_status");

        // if (status && status.getValue() !== 1) {
        //     await Xrm.Navigation.openAlertDialog({
        //         text: "Only an Active Case can be resolved."
        //     });
        //     return;
        // }

        try {
            Xrm.Utility.showProgressIndicator(
                "Checking open activities..."
            );

            var activityCount = await getOpenActivityCount(caseId);

            Xrm.Utility.closeProgressIndicator();

            var message = activityCount > 0
                ? "You have " + activityCount +
                  " open activit" +
                  (activityCount === 1 ? "y" : "ies") +
                  ". Confirming will result in cancelling the open activities."
                : "Are you sure you want to resolve this Case?";

            var confirmed = await Xrm.Navigation.openConfirmDialog({
                title: "Resolve Case",
                text: message,
                confirmButtonLabel: "Confirm",
                cancelButtonLabel: "Cancel"
            });

            if (!confirmed.confirmed) {
                return;
            }

            // if (activityCount > 0) {
            //     await Xrm.Navigation.openAlertDialog({
            //         title: "Activities not cancelled",
            //         text: "Activity cancellation is not implemented yet. " +
            //               "The Case has not been resolved. Please cancel " +
            //               "the activities first."
            //     });
            //     return;
            // }
            if (activityCount > 0) {
    Xrm.Utility.showProgressIndicator("Cancelling open activities...");

    try {
        var tables = ["task", "phonecall", "email", "appointment"];

        for (var i = 0; i < tables.length; i++) {
            var table = tables[i];

            var query =
                "?$select=activityid" +
                "&$filter=_regardingobjectid_value eq " + caseId +
                " and statecode eq 0";

            var result = await Xrm.WebApi.retrieveMultipleRecords(
                table,
                query
            );

            while (true) {
                for (var j = 0; j < result.entities.length; j++) {
                    await Xrm.WebApi.updateRecord(
                        table,
                        result.entities[j].activityid,
                        { statecode: 2 }
                    );
                }

                if (!result.nextLink) {
                    break;
                }

                result = await Xrm.WebApi.retrieveMultipleRecords(
                    table,
                    result.nextLink
                );
            }
        }
    } catch (activityError) {
        Xrm.Utility.closeProgressIndicator();

        await Xrm.Navigation.openAlertDialog({
            title: "Activity Cancellation Failed",
            text: activityError.message ||
                  "An activity could not be cancelled. The Case was not resolved."
        });

        return;
    }

    Xrm.Utility.closeProgressIndicator();
}

            Xrm.Utility.showProgressIndicator("Resolving Case...");

            var request = {
                entity: {
                    entityType: "bss_case",
                    id: caseId
                },
                getMetadata: function () {
                    return {
                        boundParameter: "entity",
                        parameterTypes: {
                            entity: {
                                typeName: "mscrm.bss_case",
                                structuralProperty: 5
                            }
                        },
                        operationType: 0,
                        operationName: "bss_resolvecase"
                    };
                }
            };

            await Xrm.WebApi.online.execute(request);

            Xrm.Utility.closeProgressIndicator();

            await Xrm.Navigation.openAlertDialog({
                text: "Case resolved successfully."
            });

            await formContext.data.refresh(false);

            formContext.ui.controls.forEach(function (control) {
                if (control &&
                    typeof control.setDisabled === "function") {
                    control.setDisabled(true);
                }
            });

        } catch (error) {
            Xrm.Utility.closeProgressIndicator();

            await Xrm.Navigation.openAlertDialog({
                title: "Resolve Case Failed",
                text: error.message ||
                      "An unexpected error occurred."
            });
        }
    }

    return {
        resolve: resolve
    };
})();
