/*
 * Copyright (C) 2011  JTalks.org Team
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */

/** Namespace for this file */
var CodeHighlighting = {}

CodeHighlighting.ADD_COMMENT_FORM_ID = 'add-comment-form';

/**
 * Called when document rendering is completed. Highlight code and
 * sets up handlers for code review if needed.
 */
$(document).ready(function () {
    prettyPrint(function () {
        var hasCodeReview = $('#has-code-review').val();
        if (hasCodeReview == 'true') {
            CodeHighlighting.displayReviewComments().done(CodeHighlighting.setupEditButtons);

			CodeHighlighting.setupGeneralHandlers();
			
            var branchId = $('#branchId').val();
            PermissionService.hasPermission(branchId, 'BRANCH',
                    'BranchPermission.LEAVE_COMMENTS_IN_CODE_REVIEW',
                    CodeHighlighting.setupAddCommentFormHandlers);
			
			CodeHighlighting.setupEditCommentHandlers();
        }
    });
});

/**
 * Function to append comment to HTML
 */
CodeHighlighting.addComment = function (comment) {
    var nextLine = $('.script-first-post ol.linenums li:nth-child(' + comment.lineNumber + ') ~ li:first');
    if (nextLine.length > 0) {
        nextLine.before(CodeHighlighting.getCommentHtml(comment));
    }
    else {
        $('.script-first-post ol.linenums li:nth-child(' + comment.lineNumber + ')')
                .parent('.linenums').append(CodeHighlighting.getCommentHtml(comment))
    }
}

/**
 * Function to update existing comment
 */
CodeHighlighting.updateComment = function (comment) {
    var reviewContainer = $('.script-first-post .review-container input[name=id][value=' + comment.id + ']').parent();
	reviewContainer.find('.review-body').html(CodeHighlighting.htmlEncode(comment.body));
}

/**
 * Get review comments for this topic from server and display them
 * @return deffered object for AJAX request (displaying comments)
 */
CodeHighlighting.displayReviewComments = function () {
    var codeReviewId = $('#codeReviewId').val();
    return $.ajax({
        url: baseUrl + '/reviews/' + codeReviewId + '/json',
        type: "GET",
        success: function (data) {
            var comments = data.result.comments;
            for (var i = 0; i < comments.length; i++) {
                CodeHighlighting.addComment(comments[i]);
            }
        },
        error: function () {
            bootbox.alert($labelUnexpectedError);
        }
    });
}

/**
 * Initializes general handlers
 */
CodeHighlighting.setupGeneralHandlers = function() {
	$('.script-first-post').on('click', 'input:button[name=cancel]', function (event) {
        event.stopPropagation();
        CodeHighlighting.removeCommentForm();
    });
}

/**
 * Initializes handlers for 'Add comment' action
 */
CodeHighlighting.setupAddCommentFormHandlers = function () {
    $('.script-first-post').on('click', 'ol.linenums li', function () {
        var addCommentForm = $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID);
        if (addCommentForm.length == 0) {
            var index = $(this).index();
			CodeHighlighting.showAddCommentForm($(this), index + 1);
        }
        
    });

    $('.script-first-post').on('click', "input:button[name=add]", function (event) {
        event.stopPropagation();

        var formContainer = $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID);
        if (Antimultipost.beingSubmitted(formContainer)) {
            return;
        }
        Antimultipost.disableSubmit(formContainer);

        
		var data = {id: 0, authorId:0, authorUsername:""};
        data.lineNumber = $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID + ' [name=lineNumber]').val();
        data.body = $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID + ' [name=body]').val();
		data.reviewId = $('#codeReviewId').val();
		
        $.post(baseUrl + '/reviewcomments/new', data)
                .success(function (data) {
                    if (data.status == 'Success') {
                        CodeHighlighting.removeCommentForm();
						CodeHighlighting.addComment(data.result)
                    }
                    else if (data.reason == 'validation') {
                        CodeHighlighting.displayValidationErrors(data.result);
                    }
                    else {
                        bootbox.alert($labelUnexpectedError);
                    }
                })
                .error(function (data) {
                    bootbox.alert($labelUnexpectedError);
                })
                .complete(function () {
                    Antimultipost.enableSubmit(formContainer);
                });
    });
}

/**
 * Initializes handlers for 'Edit comment' actions
 */
CodeHighlighting.setupEditCommentHandlers = function() {
	$('.script-first-post').on('click', 'div.review-container a[name=edit-review]', function() {
		var addCommentForm = $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID);
		if (addCommentForm.length == 0) {
			var reviewContainer = $(this).closest('.review-container');
			var comment = {};
			comment.id = reviewContainer.find('input[name=id]').val();
			comment.body = reviewContainer.find('.review-body').html();
			CodeHighlighting.showEditCommentForm(reviewContainer, comment);
        }
		
		return false;
	});
	
	$('.script-first-post').on('click', "input:button[name=edit]", function (event) {
        event.stopPropagation();

        var formContainer = $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID);
        if (Antimultipost.beingSubmitted(formContainer)) {
            return;
        }
        Antimultipost.disableSubmit(formContainer);

		var data = {authorId:0, authorUsername:""};
		data.id = $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID + ' [name=id]').val();
        data.lineNumber = $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID + ' [name=lineNumber]').val();
        data.body = $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID + ' [name=body]').val();
		data.branchId = $('#branchId').val();
        
        $.post(baseUrl + '/reviewcomments/edit', data)
                .success(function (data) {
                    if (data.status == 'Success') {
                        CodeHighlighting.removeCommentForm();
						CodeHighlighting.updateComment(data.result);
                    }
                    else if (data.reason == 'validation') {
                        CodeHighlighting.displayValidationErrors(data.result);
                    }
                    else {
                        bootbox.alert($labelUnexpectedError);
                    }
                })
                .error(function (data) {
                    bootbox.alert($labelUnexpectedError);
                })
                .complete(function () {
                    Antimultipost.enableSubmit(formContainer);
                });
    });
}

/**
 * Loop through the comments and add edit buttons to those which current user
 * can edit
 */
CodeHighlighting.setupEditButtons = function() {
	var branchId = $('#branchId').val();
	var userId = $('#userId').val();
	var canEditOwnPosts = PermissionService.getHasPermission(branchId, 'BRANCH',
                    'BranchPermission.EDIT_OWN_POSTS');
	var canEditOtherPosts = PermissionService.getHasPermission(branchId, 'BRANCH',
                    'BranchPermission.EDIT_OTHERS_POSTS');
	
	$('.script-first-post div.review-container').each(function() {
		var authorId = $(this).find('input[name=authorId]').val();
		if (canEditOtherPosts || (authorId == userId && canEditOwnPosts)) {
			$(this).find('.review-buttons').append(
				'<a href="" name=edit-review>' + $labelEdit + '</a>'
			);
		}
	});
}

/**
 * Build HTML piece for review comment
 * @param comment code review comment
 * @return div (string) with comment data
 */
CodeHighlighting.getCommentHtml = function (comment) {
    var result =
            '<div class="review-container"> '
				+ '<input type=hidden name=id value="' + comment.id + '"/>'
				+ '<input type=hidden name=authorId value="' + comment.authorId + '"/>'
                + '<div class="review-avatar">'
                    + '<img class="review-avatar-img" src="' + baseUrl + '/users/' + comment.authorId + '/avatar"/>'
                + '</div>'
                + '<div class="review-content">'
				    + '<div class="review-buttons" style="float:right"/>'
                    + '<div class="review-header">'
						+ '<a href="' + baseUrl + '/users/' + comment.authorId + '">' + CodeHighlighting.htmlEncode(comment.authorUsername) + '</a>'
						+ ' ' + $labelReviewSays + ': '
                    + '</div>'
                    + '<div class="review-body">'
						+ CodeHighlighting.htmlEncode(comment.body)
                    + '</div>'
                + '</div>'
            + '</div>';
    return result;
}

/**
 * Build HTML piece for add comment form
 * @param submitButtonTitle title of submit button
 * @param submitButtonName name of submit button element
 * @param lineNumber number of line where form will be placed
 * @param comment data to fill form if defined
 * @return string with HTML piece for the form
 */
CodeHighlighting.getCommentForm = function (submitButtonTitle, submitButtonName, lineNumber, comment) {
    if (comment === undefined) {
		comment = {id:0,body:''};
	}
    var result =
            '<div id="' + CodeHighlighting.ADD_COMMENT_FORM_ID + '" class="review-container">'
                + '<div class="control-group">'
                    + '<input type=hidden name=lineNumber value="' + lineNumber + '"/>'
					+ '<input type=hidden name=id value="' + comment.id + '"/>'
                    + '<textarea name="body" class="review-container-content">' + comment.body + '</textarea>'
                + '</div>'
                + '<div>'
                    + '<input type=button name="' + submitButtonName + '" value="' + submitButtonTitle + '" class="btn btn-primary review-container-controls-ok"/>'
                    + '<input type=button name=cancel value="' + $labelCancel + '" class="btn review-container-controls-cancel"/>'
                + '</div>'
                + '<span class="keymaps-caption">' + $labelKeymapsReview + '</span>'
            + '</div>';
    return result;
}

/**
 * Show comment form below given element
 * @param element jquery element after which show form
 * @param submitButtonTitle title of submit button
 * @param submitButtonName name of submit button element
 * @param lineNumber number of line where form will be placed
 * @param comment data to fill form if defined
 */
CodeHighlighting.showCommentForm = function(element, submitButtonTitle, submitButtonName, lineNumber, comment) {
	element.after(CodeHighlighting.getCommentForm(submitButtonTitle, submitButtonName, lineNumber + 1, comment));
	var reviewContent = $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID + ' textarea');
    reviewContent.keydown(Keymaps.review);
    reviewContent.focus();
}

/**
 * Show 'add comment' form below given element
 * @param element jquery element after which show form
 * @param lineNumber number of line where form will be placed
 */
CodeHighlighting.showAddCommentForm = function(element, lineNumber) {
	CodeHighlighting.showCommentForm(element, $labelAdd, 'add', lineNumber);
}

/**
 * Show 'edit comment' form below given element
 * @param element jquery element after which show form
 * @param comment data to fill form
 */
CodeHighlighting.showEditCommentForm = function(element, comment) {
	CodeHighlighting.showCommentForm(element, $labelEdit, 'edit', 0, comment);
}

/**
 * Remove comment form from the page
 */
CodeHighlighting.removeCommentForm = function () {
    $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID).remove();
}

/**
 * Display error messages
 *
 * @param errors list or errors
 */
CodeHighlighting.displayValidationErrors = function (errors) {
    $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID + ' span.help-inline').remove();

    if (errors.length > 0) {
        var currentControlGroup = $('#' + CodeHighlighting.ADD_COMMENT_FORM_ID + ' [name=body]').parent();
        currentControlGroup.addClass("error");
        currentControlGroup.append('<span class="help-inline"/>');

        var errorsContainer = currentControlGroup.find('span.help-inline');
        for (var i = 0; i < errors.length; i++) {
            errorsContainer.append(errors[i].message + '<br/>');
        }
    }
}

/**
 * Encodes given string by escaping special HTML characters
 * 
 * @param s string to be encoded
 */
CodeHighlighting.htmlEncode = function(s)
{
  var el = document.createElement("div");
  el.innerText = el.textContent = s;
  s = el.innerHTML;
  return s;
}