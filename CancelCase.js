
var BSS = BSS || {};

BSS.CancelCase = async function (primaryControl) {
    var formContext = primaryControl;

    if (!formContext || !formContext.data || !formContext.data.entity) {
        Xrm.Navigation.openAlertDialog({
            text: "Unable to access the Case form."
        });
        return;
    }

    var confirmResult = await Xrm.Navigation.openConfirmDialog({
        title: "Cancel Case",
        text: "Are you sure you want to cancel this Case?"
    });

    if (!confirmResult.confirmed) {
        return;
    }

    var caseId = formContext.data.entity.getId();

    if (!caseId) {
        Xrm.Navigation.openAlertDialog({
            text: "Please save the Case before cancelling it."
        });
        return;
    }

    caseId = caseId.replace(/[{}]/g, "");

    var updateData = {
        bss_statusreason: 7,
        bss_status: 3,
        statecode: 1
    };

    try {
        await Xrm.WebApi.updateRecord(
            "bss_case",
            caseId,
            updateData
        );

        await Xrm.Navigation.openAlertDialog({
            text: "Case cancelled successfully."
        });

        await formContext.data.refresh(false);
    } catch (error) {
        await Xrm.Navigation.openAlertDialog({
            text: "Unable to cancel the Case: " + error.message
        });
    }
};
