import {Component, Input, OnInit} from '@angular/core';
import {CommentType} from "../../../../types/comment.type";
import {CommentReactionType} from "../../../../types/comment-reaction.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {HttpErrorResponse} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {CommentsService} from "../../../shared/services/comments.service";
import {CommentReactionResponseType} from "../../../../types/comment-reaction-response.type";
import {AuthService} from "../../../core/auth/auth.service";

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss']
})
export class CommentComponent implements OnInit {
  @Input() comment!: CommentType;
  @Input() articleId!: string;
  likeChecked: boolean = false;
  dislikeChecked: boolean = false;
  violateSend: boolean = false;
  private isLogged: boolean = false;

  constructor(private _snackBar: MatSnackBar,
              private authService: AuthService,
              private commentsService: CommentsService,) {
  }

  ngOnInit(): void {
    this.isLogged = this.authService.getIsLoggedIn();

    this.likeChecked = false;
    this.dislikeChecked = false;

    if (this.isLogged) {
      this.commentsService.getUserReactions(this.articleId)
        .subscribe({
          next: ((data: CommentReactionResponseType[]) => {
            const commentWithUserReaction = data.find(item => {
              return item.comment === this.comment.id;
            });

            if (commentWithUserReaction) {
              if (commentWithUserReaction.action === CommentReactionType.like) {
                this.likeChecked = true;
              } else if (commentWithUserReaction.action === CommentReactionType.dislike) {
                this.dislikeChecked = true;
              }
            }
          }),
          error: ((errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              this._snackBar.open(errorResponse.error.message);
            } else {
              this._snackBar.open('Ошибка выполнения запроса!');
            }
          })
        })
    }
  }

  like(id: string) {
    if (this.likeChecked) {
      this.likeChecked = false;
      this.comment.likesCount -= 1;
    } else {
      if (this.dislikeChecked) {
        this.dislikeChecked = false;
        this.comment.dislikesCount -= 1;
      }

      this.commentsService.applyReactionToComment(id, CommentReactionType.like)
        .subscribe({
          next: ((data: DefaultResponseType) => {
            if (!data.error) {
              this.likeChecked = true;
              this.comment.likesCount += 1;
              this._snackBar.open('Ваш голос учтен!');
            }
          }),
          error: ((errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              this._snackBar.open(errorResponse.error.message);
            } else {
              this._snackBar.open('Ошибка выполнения запроса!');
            }
          })
        })
    }
  }

  dislike(id: string) {
    if (this.dislikeChecked) {
      this.dislikeChecked = false;
      this.comment.dislikesCount -= 1;
    } else {
      if (this.likeChecked) {
        this.likeChecked = false;
        this.comment.likesCount -= 1;
      }
      this.commentsService.applyReactionToComment(id, CommentReactionType.dislike)
        .subscribe({
          next: ((data: DefaultResponseType) => {
            if (!data.error) {
              this.dislikeChecked = true;
              this.comment.dislikesCount += 1;
              this._snackBar.open('Ваш голос учтен!');
            }
          }),
          error: ((errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              this._snackBar.open(errorResponse.error.message);
            } else {
              this._snackBar.open('Ошибка выполнения запроса!');
            }
          })
        })
    }
  }

  sendViolate(id: string) {
    if (this.violateSend) {
      this._snackBar.open('Жалоба уже отправлена!')
    } else {
      this.commentsService.applyReactionToComment(id, CommentReactionType.violate)
        .subscribe({
          next: ((data: DefaultResponseType) => {
            if (!data.error) {
              this._snackBar.open('Жалоба уже отправлена!');
            } else {
              this._snackBar.open(data.message);
            }
          }),
          error: ((errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              if (errorResponse.status === 400) {
                this._snackBar.open('Жалоба уже отправлена!');
              } else {
                this._snackBar.open(errorResponse.message);
              }
            } else {
              this._snackBar.open('Ошибка выполнения запроса!');
            }
          })
        })
    }
  }
}
