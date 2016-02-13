chrome.runtime.onInstalled.addListener(function () {
    // Replace all rules ...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        // With a new rule ...
        chrome.declarativeContent.onPageChanged.addRules([
            {
                // That fires when a page's URL contains a 'lowendtalk.com' ...
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: {urlContains: 'lowendtalk.com'},
                    })
                ],
                // And shows the extension's page action.
                actions: [new chrome.declarativeContent.ShowPageAction()]
            }
        ]);
    });

    chrome.contextMenus.create({

        title: "Block %s",
        contexts:["link"],
        id:"blockId",
        documentUrlPatterns:["*://*.lowendtalk.com/*"],
        targetUrlPatterns:["*://*.lowendtalk.com/profile/*"]


    });

    chrome.contextMenus.create({

        title: "Unblock %s",
        contexts:["link"],
        id:"unblockId",
        documentUrlPatterns:["*://*.lowendtalk.com/*"],
        targetUrlPatterns:["*://*.lowendtalk.com/profile/*"]


    });

    chrome.contextMenus.create({

        title: "Clear block list",
        contexts:["all"],
        id:"clearId",
        documentUrlPatterns:["*://*.lowendtalk.com/*"],

    });

    chrome.contextMenus.onClicked.addListener(function(info, tab) {
        if (info.menuItemId === "blockId") {
            blockUser(info.selectionText);
        } else if (info.menuItemId === "unblockId") {
            unblockUser(info.selectionText);
        } else if (info.menuItemId === "clearId") {
            clearBlockList();
        }
    });
});

function blockUser(user) {

    chrome.storage.sync.get("blocked_users", function(blockedUsers){
        var users = [];
        if (blockedUsers.blocked_users != null && blockedUsers.blocked_users instanceof Array) {
            users = blockedUsers.blocked_users;
        }
        if (users.indexOf(user) >= 0) {
            console.log(users);
            console.log(user + " already blocked!");
            return; // user already blocked
        }
        users.push(user);
        console.log(users);
        chrome.storage.sync.set({'blocked_users': users}, function() {

            console.log('Block list updated after blocking an user.');

            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "block", user: user});
            });
        });
    });


}

function unblockUser(user) {
    chrome.storage.sync.get("blocked_users", function(blockedUsers){
        var users = blockedUsers.blocked_users;
        if (users == null || !(users.indexOf(user)>=0)) {
            console.log(users);
            console.log(user + " wasn't blocked.");
            return;
        }

        users.splice(users.indexOf(user), 1);
        console.log(users);
        console.log("Unblocked: " + user);
        chrome.storage.sync.set({'blocked_users': users}, function() {
            console.log('Block list updated after unblocking and user.');
        });
    });
}

function clearBlockList() {
    chrome.storage.sync.set({'blocked_users': null}, function() {
        console.log('Cleaned block list');
    });
}

