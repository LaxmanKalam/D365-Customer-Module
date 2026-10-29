
var BSS = window.BSS || {};

BSS.ResolveCase = (function () {
    "use strict";

    async function resolve(primaryControl) {
        var formContext = primaryControl;

        if (!formContext || !formContext.data || !formContext.data.entity) {
            Xrm.Navigation.openAlertDialog({
                text: "Unable to access the Case form."
            });
            return;
        }

        var caseId = formContext.data.entity.getId();

        if (!caseId) {
            Xrm.Navigation.openAlertDialog({
                text: "Please save the Case before resolving it."
            });
            return;
        }

        caseId = caseId.replace(/[{}]/g, "");

        var status = formContext.getAttribute("bss_status");
        if (status && status.getValue() !== 1) {
            await Xrm.Navigation.openAlertDialog({
                text: "Only an Active Case can be resolved."
            });
            return;
        }

        var confirmed = await Xrm.Navigation.openConfirmDialog({
            title: "Resolve Case",
            text: "Are you sure you want to resolve this Case?"
        });

        if (!confirmed.confirmed) {
            return;
        }

        Xrm.Utility.showProgressIndicator("Resolving Case...");

        try {
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
                if (control && typeof control.setDisabled === "function") {
                    control.setDisabled(true);
                }
            });

        } catch (error) {
            Xrm.Utility.closeProgressIndicator();

            await Xrm.Navigation.openAlertDialog({
                title: "Resolve Case Failed",
                text: error.message || "An error occurred while resolving the Case."
            });
        }
    }

    return {
        resolve: resolve
    };
})();
