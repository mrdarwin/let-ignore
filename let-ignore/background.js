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

    chrome.contextMenus.create({

        title: "Block images",
        contexts:["all"],
        id:"blockImgId",
        documentUrlPatterns:["*://*.lowendtalk.com/*"],

    });

    chrome.contextMenus.create({

        title: "Unblock images",
        contexts:["all"],
        id:"unblockImgId",
        documentUrlPatterns:["*://*.lowendtalk.com/*"],

    });

    chrome.contextMenus.onClicked.addListener(function(info, tab) {
        if (info.menuItemId === "blockId") {
            blockUser(info.selectionText);
        } else if (info.menuItemId === "unblockId") {
            unblockUser(info.selectionText);
        } else if (info.menuItemId === "clearId") {
            clearBlockList();
        } else if (info.menuItemId === "blockImgId") {
            blockImgs();
        } else if (info.menuItemId === "unblockImgId") {
            unblockImgs();
        }
    });
    blockingImgs = false;
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




/*
Keep block/unblock images
 */
var blockingImgs = false;

chrome.storage.sync.get({'blocking_imgs': true}, function(obj) {
    if (obj.blocking_imgs == null || obj.blocking_imgs.length <=0) {
        unblockImgs();
    }  else {
        blockingImgs = true;
    }
});

function blockImgs() {
    blockingImgs = true;
    chrome.storage.sync.set({'blocking_imgs': true}, function() {
        console.log('Blocking imgs');
    });
}

function unblockImgs() {
    blockingImgs = false;
    chrome.storage.sync.set({'blocking_imgs': false}, function() {
        console.log('Not blocking imgs');
    });
}


chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        if (details.tabId == -1) {
            return {cancel:false};
        }
        var tab = tabs[details.tabId];
        console.info(tab.url);
        if (tab.url.indexOf("lowendtalk.com") == -1) {
            console.info("Not let :" + tab.url);
            return {cancel: false};
        }

        return {cancel: blockingImgs && details.url.indexOf("https://www.lowendtalk.com/") == -1 && details.url.indexOf("https://secure.gravatar.com/") == -1 && details.url.indexOf("http://cdn.vanillaforums.com/")==-1 };

    },
    {urls: ["<all_urls>"], types: ["image"]},
    ["blocking"]
);

/*
 * --------------------------------------------------
 * Keep list of tabs outside of request callback
 * --------------------------------------------------
 */
var tabs = {};

// Get all existing tabs
chrome.tabs.query({}, function(results) {
    results.forEach(function(tab) {
        tabs[tab.id] = tab;
    });
});

// Create tab event listeners
function onUpdatedListener(tabId, changeInfo, tab) {
    tabs[tab.id] = tab;
}
function onRemovedListener(tabId) {
    delete tabs[tabId];
}

// Subscribe to tab events
chrome.tabs.onUpdated.addListener(onUpdatedListener);
chrome.tabs.onRemoved.addListener(onRemovedListener);
