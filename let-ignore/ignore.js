function blockUsers(users) {
    $("a.Username").each(function (index) {
        var currentUser = $(this).text();

        if (currentUser == users || (users instanceof Array && users.indexOf(currentUser) >= 0)) {
            var parent = $(this).closest("li");

            if (parent.length == 0) {//author
                parent = $(this).closest(".Discussion")
            }
            parent.find(".Item-BodyWrap").text("This user is being ignored");
        }
    });
}

function changeInlineImgsToLinks() {
    $(".Item-BodyWrap").find("img").each(function(index) {
        var src = $(this).attr("src");
        console.log("src:" + src);
        var img =$(this).replaceWith(function(){
            return $("<a />", {html: $(this).html(), text:src, href:src});
        });
        console.log(img);
        $(img).attr("href", src);
        $(img).text(src);
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

chrome.storage.sync.get("blocking_imgs", function(obj) {
    var blockingImgs = obj.blocking_imgs;
    if (blockingImgs == null || blockingImgs.length <= 0 || !blockingImgs) {
        return;
    }
    changeInlineImgsToLinks();
});

chrome.storage.sync.get("blocked_users", function (blockedUsers) {
    var users = blockedUsers.blocked_users;
    if (users == null || users.length <= 0) {
        return
    }
    blockUsers(users);
});
