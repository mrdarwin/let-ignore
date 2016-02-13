function blockUsers(users) {
    $("a.Username").each(function (index) {
        var currentUser = $(this).text();

        if (currentUser == users || (users instanceof Array && users.indexOf(currentUser) >=0)) {
            $(this).closest("li").find(".Item-BodyWrap").text("This user is being ignored");
        }
    });
}

chrome.runtime.onMessage.addListener(
    function (request, sender, response) {
        console.log("onMessage");
        console.log(request);
        if (request.action == "block") {
            console.log("blocking :" + request.user);
            blockUsers(request.user);
        }
    }
);

chrome.storage.sync.get("blocked_users", function(blockedUsers) {
    var users = blockedUsers.blocked_users;
    if (users == null || users.length <=0) {
        return
    }
    blockUsers(users);
});

