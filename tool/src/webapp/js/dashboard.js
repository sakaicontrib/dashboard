/*
 stripe the tables, take out when can figure how to do in wicket
 */
var setupTableStriping = function(){
    $('table').each(function(){
        $(this).find('tr:even').addClass('even');
    });
};

/*
 eliminate whitespace only text nodes
 needed to style the wicket pager
 */
jQuery.fn.htmlClean = function(){
    this.contents().filter(function(){
        if (this.nodeType != 3) {
            $(this).htmlClean();
            return false;
        }
        else {
            return !/\S/.test(this.nodeValue);
        }
    }).remove();
};

/*
 add css classes to wicket pager based on block having a link or not
 */
jQuery.fn.cssInstrument = function(){
    $('.pager > span').each(function(i){
        if ($(this).find('a').length === 1) {
            $(this).addClass('linky');
        }
        else {
            $(this).addClass('nolinky');
        }
    });
};

//toggle a fade
jQuery.fn.fadeToggle = function(speed, easing, callback){
    return this.animate({
        opacity: 'toggle'
    }, speed, easing, callback);
    
};

var setupMenus = function(){
    $('tr').mouseenter(function(){
        $(this).find('.actionPanelTrig').show();
    });
    $('tr').mouseleave(function(){
        $(this).find('.actionPanelTrig').hide();
    });
    $('.actionPanelTrig').click(function(e){
        e.preventDefault();
        $(this).closest('tr').addClass('focusedRow');
        var pos = $(this).closest('td.action').position();
        var height = $(this).closest('td').height();
        $('.actionPanel').hide();
        $(this).parent('td').find('.actionPanel').css({
            'position': 'absolute',
            'left': pos.left - 190,
            'top': pos.top + 3
        }).toggle();
    });
    
    $('.actionPanel').mouseleave(function(){
        $(this).hide();
        $(this).closest('tr').removeClass('focusedRow');
    });
};

var setupLinks = function(){
	$(".siteLink").live("click", function(e){
		// DO NOT CALL:  e.preventDefault();
        var itemType = $(this).closest('tr').find('.itemType').text();
        var entityReference = $(this).closest('tr').find('.entityReference').text();
        reportEvent(e.target, entityReference, itemType, "dash.follow.site.link");
	});
    $(".itemLink").live("click", function(e){
        e.preventDefault();
        var actionLink = "";
        var action = "";
        var link = $(this).attr('href');
        var title = $(this).text();
        var parentRow = $(this).closest('tr');
        var colCount = $(parentRow).find('td').length;
        var parentCell = $(this).closest('td');
        
        var itemType = $(this).closest('tr').find('.itemType').text();
        var entityReference = $(this).closest('tr').find('.entityReference').text();
        var itemCount = $(this).closest('tr').find('.itemCount').text();
        var callBackUrl = $(this).closest('body').find('.callBackUrl').text();
        //if disclosure in DOM, either hide or show, do not request data
        if ($(parentRow).next('tr.newRow').length === 1) {
            $(parentRow).next('tr.newRow').find('.results').fadeToggle('fast', '', function(){
                    $(parentCell).toggleClass('activeCell');
                    $(parentRow).next('tr.newRow').toggle();
            });
        }
        else {
            $(parentCell).attr('class', 'activeCell tab');
            params = {
                'entityType': itemType,
                'entityReference': entityReference,
                'itemCount': itemCount
            };
            
            if (itemCount == 1) {
                jQuery.ajax({
                    url: callBackUrl,
                    type: 'post',
                    cache: false,
                    data: JSON.stringify(params),
                    contentType: 'application/json',
                    dataType: 'json',
                    success: function(json){
                        delimitLeft = "{";
                        delimitRight = "}";
                        
                        var results = '<div class=\"results\" style=\"display:none\">';
                        if (json.order.length !== 0) {
                        
                        
                            $(json.order).each(function(i){
                                var o = this;
                                var w = o.toString();
                                
                                if (get_type(json[w]) === "String") {
                                    // a string
                                    if (json[w].split(delimitLeft).length - 1 > 0) {
                                        // a string that has substitions, replace them
                                        var endString = json[w];
                                        var arr = json[w].split(delimitRight);
                                        for (i = 0; i < arr.length; i++) {
                                            var arr2 = arr[i].split(delimitLeft);
                                            if (arr2[1]) {
                                                endString = endString.replace(delimitLeft + arr2[1] + delimitRight, json[arr2[1]]);
                                            }
                                        }
                                        // should do a check here, to make sure that all the keys had a value
                                        // increase a counter for each successful arr2[1] and compare in the end with
                                        // the length of json[w].split('{').length - 1
                                        results = results + '<div class="metadataLine">' + endString + '</div>';
                                    }
                                    else 
                                        if (json[w + '-label']) {
                                            // a string with a label counterpart
                                            results = results + '<h5>' + json[w + '-label'] + '</h5><div class="block">' + json[w] + '</div>';
                                            
                                        }
                                        else {
                                            if (w === 'title') {
                                                // a title string
                                                results = results + '<h4>' + json[w] + '</h4>';
                                            }
                                            else {
                                                //all other strings
                                                results = results + '<div class="block">' + json[w] + '</div>';
                                            }
                                        }
                                    
                                    
                                }
                                else {
                                    // is an object, treat special
                                    if (w === 'attachments' && json[w]) {
                                        var atts = "";
                                        for (i = 0; i < json[w].length; i++) {
                                        
                                            atts = atts + '<li><a href=\"' + json[w][i]['attachment-url'] + '\" onClick=\"reportEvent(this,\'/dashboard/link' 
                                            + entityReference + '\',\'' + itemType + '\',\'dash.view.attachment\');\">' + json[w][i]['attachment-title'] + '</a></li>';
                                            
                                            
                                            
                                        }
                                        results = results + '<ul class=\"attachList\">' + atts + '</ul>';
                                    }
                                    if (w === 'more-info' && json[w]) {
                                        var moreinfo = "";
                                        for (i = 0; i < json['more-info'].length; i++) {
                                            var target = "";
                                            var size = "";
                                            var dashEvent = "dash.access.url";
                                            if (json['more-info'][i]['info_link-target']) {
                                                target = 'target=\"' + json['more-info'][i]['info_link-target'] + '\"';
                                                if(json['more-info'][i]['info_link-target'] === '_top') {
                                                	dashEvent = "dash.follow.tool.link";
                                                }
                                            }
                                            if (json['more-info'][i]['info_link-size']) {
                                                size = ' (' + json['more-info'][i]['info_link-size'] + ') ';
                                            }
                                            
                                            moreinfo = moreinfo + '<li><a ' + target + ' href=\"' + json['more-info'][i]['info_link-url'] + '\" onClick=\"reportEvent(this,\'/dashboard/link' 
                                            + entityReference + '\',\'' + itemType + '\',\'' + dashEvent + '\');\">' + json['more-info'][i]['info_link-title'] + '<span class=\"size\">' + size + '</span></a></li>';
                                            
                                        }
                                        
                                        results = results + '<ul class=\"moreInfo\">' + moreinfo + ' </ul>';
                                    }
                                }
                                
                            });
                            results = results + '</div>';
                        }
                        else {
                            results = results + 'This item type has not specified an order :( </div>';
                        }
                        $('<tr class=\"newRow\"><td colspan=\"' + colCount + '\">' + results + '</td></tr>').insertAfter(parentRow);
                        $(parentRow).next('tr.newRow').find('.results').slideDown('slow', function(){
                            resizeFrame('grow');
                        });
                        
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown){
                        alert("error :" + XMLHttpRequest.responseText);
                    }
                });
            }
            else {
            
                jQuery.ajax({
                    url: callBackUrl,
                    type: 'post',
                    cache: false,
                    data: JSON.stringify(params),
                    contentType: 'application/json',
                    dataType: 'json',
                    success: function(json){
                        var results = '<div class=\"results\" style=\"display:none\"><table class=\"itemCollection\" cellpadding=\"0\" cellspacing=\"0\">';
                        $(json).each(function(i){
                            var icon = "";
                            var starIcon = "#";
                            var hideIcon = "#"
                            
                            if (this.iconUrl) {
                                icon = '<img class=\"resIcon\" src=\"' + this.iconUrl + '\"/> ';
                            }
                            else {
                                icon = '';
                            }
                            if(this.sticky) {
                            	starIcon = '/dashboard-tool/css/img/star-act.png';
                            } else {
                            	starIcon = '/dashboard-tool/css/img/star-inact.png'
                            }
                            if (this.hidden) {
                            	hideIcon = '/dashboard-tool/css/img/accept.png';
                            } else {
                            	hideIcon = '/dashboard-tool/css/img/cancel.png';
                            }
                            var link = '';
                            row = '<td class="one">\n<span class="itemType" style="display:none;">' + this.itemType + '</span>\n<span class="itemCount" style="display:none;">0</span>\n<span class="entityReference" style="display:none;">' + this.entityReference + '</span>\n</td>\n<td class="two date"></td>\n<td class="tab three">\n<a href="#" class="itemLink" target="_top">' + icon + ' ' + this.title + '</a><span class="itemLabel">' + this.label + '</span>\n</td>\n<td class="four"></td>\n<td class="action five">\n<a href="#"><img alt="[ Star/Unstar This ]" src="' + starIcon + '" /></a>\n</td>\n<td class="action six">\n<a href="#"><img alt="[ Hide/Show This ]" src="' + hideIcon + '" /></a>\n</td>\n'

                            //if (itemType === "resource") {
                            //    row = '<td style=\"width:50%\" class=\"toggleCell resourceLink\"><a href=\"#\" class =\"itemLink\">' + icon + this.title + '</a></td><td style=\"width:50%\"><em style=\"display:none\"><span class=\"itemType\">' + itemType + '</span><span class=\"itemCount\">1</span><span class=\"entityReference\">' + this.entityReference + '</span></em><a href=\"/access' + this.entityReference + '\" target =\"_blank\">Download</a></td>';
                            //}
                            //else {
                            //    row = '<td class=\"toggleCell\"><em style=\"display:none\"><span class=\"itemType\">' + itemType + '</span><span class=\"itemCount\">1</span><span class=\"entityReference\">' + this.entityReference + '</span></em><a href=\"#\" class =\"itemLink ' + itemType + '-icon\">' + icon + this.title + '</a></td>';
                            //}
                            
                            results = results + '<tr class=\"' + this.entityType + ' row' + i % 2 + '\">' + row + '</tr>';
                        });
                        results = results + '</table></div>';
                        
                        
                        $('<tr class=\"newRow\"><td colspan=\"' + colCount + '\">' + results + '</td></tr>').insertAfter(parentRow);
                        $(parentRow).next('tr.newRow').find('.results').slideDown('slow', function(){
                            resizeFrame('grow');
                        });
                        
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown){
                        alert("error :" + XMLHttpRequest.responseText);
                    }
                });
                
            }
        }
        
    });
};

function reportEvent(element, entityRef, entityType, dashEvent) {
    var callBackUrl = $(element).closest('body').find('.callBackUrl').text();
    var params = {
            'entityType': entityType,
            'entityReference': entityRef,
            'dashEvent': dashEvent,
            'itemCount': '0'
        };
    jQuery.ajax({
        url: callBackUrl,
        type: 'post',
        cache: false,
        data: JSON.stringify(params),
        contentType: 'application/json',
        dataType: 'json',
        success: function(json){
        }
    });
	
}

function get_type(thing){
    if (thing === null) {
        return "[object Null]";
    }
    return Object.prototype.toString.call(thing).match(/^\[object (.*)\]$/)[1];
}

var setupLang = function(){
    //langdata = eval('(' + $('#lang-holder').text() + ')');
};

var setupIcons = function(){
    $('.itemLink').each(function(i){
        var itemType = $(this).closest('tr').find('.itemType').text();
        if (itemType === 'resource') {
            $(this).addClass(getFileExtension($(this).attr('href')));
        }
        else {
            $(this).addClass(itemType + '-icon');
        }
    });
    function getFileExtension(filename){
        var ext = /^.+\.([^.]+)$/.exec(filename);
        return ext === null ? "" : ext[1].toLowerCase();
    }
};


/*
 resize the iframe based on the contained document height.
 used after DOM operations that add or substract to the doc height
 */
var resizeFrame = function(updown){
    var clientH;
    if (top.location !== self.location) {
        var frame = parent.document.getElementById(window.name);
    }
    if (frame) {
        if (updown === 'shrink') {
            clientH = document.body.clientHeight;
        }
        else {
            clientH = document.body.clientHeight + 50;
        }
        $(frame).height(clientH);
    }
    else {
        // throw( "resizeFrame did not get the frame (using name=" + window.name + ")" );
    }
};

var reportSuccess = function(msg, item, url){
    $('#messagePanel').html(msg).fadeTo("slow", 1).animate({opacity: 1.0}, 5000).fadeTo(3000, 0);
};

var setupDismissMOTD = function(){
    if (utils_readCookie('motdHide')){
        $('.motdPanel').css('display','none');
    } 
    else{
        $('.motdPanel').css('display','block');
    }
    $('#motdTextDivDismiss').click(function(){
        dismissMessage('.motdPanel');
    });
};


function dismissMessage(target){
    utils_createCookie('motdHide','true');
    $(target).fadeToggle(1000, 0);
    // report that MOTD has been hidden
    reportEvent(target, '/dashboard/MOTD', 'MOTD', 'dash.hide.motd');
}

/**
 * cookie create
 * @param {Object} name
 * @param {Object} value
 * @param {Object} days
 */
utils_createCookie = function(name, value, days){
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
        document.cookie = name + "=" + value + expires + "; path=/";
    }
};

/**
 * cookie read
 * @param {Object} name
 */
utils_readCookie = function(name){
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
};

/**
 * cookie delete
 * @param {Object} name
 */
utils_eraseCookie = function(name){
    createCookie(name, "", -1);
};

utils_trim = function(stringToTrim){
    return stringToTrim.replace(/^\s+|\s+$/g, "");
};