/* ============================================================
   Bitsquad side panes - ONE web resource (bss_openChatPopUp), TWO panes.
   Both panes show up as stacked icons on the D365 right-edge strip.
   Ask button   -> openCustomChatWindow
   Teams button -> openTeamsChatWindow
   Pass "PrimaryControl" as the first parameter for both buttons.
   ============================================================ */

var BSS_WEBRESOURCE = "bss_openChatPopUp";
var BSS_PANES = {
    ask:   { id: "CustomChatPane", title: "Copilot Assistant", icon: "WebResources/bss_boticon",   data: "tab=ask" },
    teams: { id: "TeamsChatPane",  title: "Teams chats",       icon: "WebResources/bss_teamsicon", data: "tab=teams" }
};

function openCustomChatWindow(primaryControl) { bssOpen("ask", primaryControl); }
function openTeamsChatWindow(primaryControl)  { bssOpen("teams", primaryControl); }

function bssOpen(tab, primaryControl) {
    try {
        var cfg = BSS_PANES[tab];

        // Toggle: clicked pane is already showing -> close the WHOLE side pane (Ask + Teams)
        var pane = Xrm.App.sidePanes.getPane(cfg.id);
        var selected = Xrm.App.sidePanes.getSelectedPane();
        var isExpanded = Xrm.App.sidePanes.state === 1;
        if (pane && isExpanded && selected && selected.paneId === cfg.id) {
            var askPane = Xrm.App.sidePanes.getPane(BSS_PANES.ask.id);
            var teamsPane = Xrm.App.sidePanes.getPane(BSS_PANES.teams.id);
            if (askPane) { askPane.close(); }
            if (teamsPane) { teamsPane.close(); }
            return;
        }

        var formContext = bssResolveForm(primaryControl);
        bssSaveBotData(formContext);

        bssBuildTeamsContext(formContext).then(function () {
            // Make sure both panes exist (Ask first, Teams below), then show the one clicked
            return bssEnsurePane(BSS_PANES.ask).then(function (askPane) {
                return bssEnsurePane(BSS_PANES.teams).then(function (teamsPane) {
                    try { Xrm.App.sidePanes.state = 1; } catch (x) { } // make sure the panel is expanded
                    return (tab === "teams" ? teamsPane : askPane).select();
                });
            });
        }).catch(function (err) {
            console.error("Side pane error:", err);
            try { Xrm.Navigation.openAlertDialog({ text: "Could not open the side pane." }); } catch (x) { }
        });
    } catch (e) {
        console.error("bssOpen failed:", e);
    }
}
function bssEnsurePane(cfg) {
    var existing = Xrm.App.sidePanes.getPane(cfg.id);
    if (existing) { return Promise.resolve(existing); }

    return Xrm.App.sidePanes.createPane({
        title: cfg.title,
        paneId: cfg.id,
        imageSrc: cfg.icon,
        hideHeader: true,
        canClose: true,
        width: 400
    }).then(function (pane) {
        return pane.navigate({
            pageType: "webresource",
            webresourceName: BSS_WEBRESOURCE,
            data: cfg.data
        }).then(function () { return pane; });
    });
}

/* Accepts formContext, executionContext, or falls back to Xrm.Page */
function bssResolveForm(arg) {
    try {
        if (arg && arg.data && arg.data.entity) { return arg; }
        if (arg && typeof arg.getFormContext === "function") { return arg.getFormContext(); }
        if (typeof Xrm !== "undefined" && Xrm.Page && Xrm.Page.data && Xrm.Page.data.entity) { return Xrm.Page; }
    } catch (e) { console.warn("Could not resolve form context:", e); }
    return null;
}

/* Bot context (same data as before) */
function bssSaveBotData(formContext) {
    try {
        if (!formContext) { return; }
        var formData = {
            entityName: formContext.data.entity.getEntityName(),
            recordId: formContext.data.entity.getId()
        };
        formContext.data.entity.attributes.forEach(function (attribute) {
            var v = attribute.getValue();
            if (v !== null && v !== undefined) { formData[attribute.getName()] = v; }
        });
        localStorage.setItem("currentFormRecordData", JSON.stringify(formData));
    } catch (e) {
        console.error("Could not save bot data:", e);
    }
}

/* Teams context: record name, owner, related records */
function bssBuildTeamsContext(formContext) {
    var ctx = { entityName: "", recordId: "", recordName: "", ownerName: "Record Owner", related: [] };

    try {
        if (formContext) {
            ctx.entityName = formContext.data.entity.getEntityName();
            ctx.recordId = formContext.data.entity.getId().replace(/[{}]/g, "").toLowerCase();
            ctx.recordName = formContext.data.entity.getPrimaryAttributeValue() || "";

            var ownerAttr = formContext.getAttribute("ownerid");
            var owner = ownerAttr ? ownerAttr.getValue() : null;
            if (owner && owner.length > 0 && owner[0].name) { ctx.ownerName = owner[0].name; }
        }
    } catch (e) {
        console.error("Could not read record/owner:", e);
    }

    return bssGetRelated(ctx.recordId).then(function (items) {
        ctx.related = items;
    }).catch(function (err) {
        console.warn("Related records failed:", err);
        ctx.related = [];
    }).then(function () {
        try { localStorage.setItem("bssTeamsContext", JSON.stringify(ctx)); }
        catch (e) { console.warn("Storage unavailable:", e); }
    });
}

/* Latest activities regarding this record; empty list if none */
function bssGetRelated(recordId) {
    if (!recordId || !Xrm.WebApi) { return Promise.resolve([]); }
    var query = "?$select=subject,activitytypecode,activityid" +
        "&$filter=_regardingobjectid_value eq " + recordId +
        "&$orderby=createdon desc&$top=5";

    return Xrm.WebApi.retrieveMultipleRecords("activitypointer", query).then(function (result) {
        return (result.entities || []).map(function (r) {
            return { title: r.subject || "(No subject)", type: r.activitytypecode || "activitypointer", id: r.activityid };
        });
    });
}