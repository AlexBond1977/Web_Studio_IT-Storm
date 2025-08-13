import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ArticlesService} from "../../../shared/services/articles.service";
import {ArticleType} from "../../../../types/article.type";
import {CommentType} from "../../../../types/comment.type";
import {LoaderService} from "../../../shared/services/loader.service";
import {AuthService} from "../../../core/auth/auth.service";
import {HttpErrorResponse} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {CommentsService} from "../../../shared/services/comments.service";

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss']
})
export class ArticleComponent implements OnInit {
  article!: ArticleType;
  relatedArticles: ArticleType[] = [];
  comments: CommentType[] = [];
  noComments: boolean = false;
  noMoreComments: boolean = false;
  totalCountComments: number | null = null;
  isLogged: boolean = true;
  textComment: string = '';
  countLike: string = '';
  // countDisLike: number = 0;

  constructor(private activatedRoute: ActivatedRoute,
              private _snackBar: MatSnackBar,
              private articlesService: ArticlesService,
              private commentsService: CommentsService,
              private authService: AuthService,
              private router: Router,
              private loader: LoaderService) {
  }

  ngOnInit() {

    this.isLogged = this.authService.getIsLoggedIn();
    console.log(this.isLogged);

    this.activatedRoute.params.subscribe({
      next: ((params) => {
        this.articlesService.getArticle(params['url'])
          .subscribe({
            next: ((data: ArticleType) => {
              this.article = data;

              const params = {offset: 0, article: this.article.id};
              this.getFirstComments(params);

            }),
            error: ((errorResponse: HttpErrorResponse) => {
              if (errorResponse.error && errorResponse.error.message) {
                this._snackBar.open(errorResponse.error.message);
              } else {
                this._snackBar.open('Ошибка получения данных статьи!');
              }
            })
          });

        this.articlesService.getRelatedArticle(params['url'])
          .subscribe({
            next: ((relatedArticles: ArticleType[]) => {
              this.relatedArticles = relatedArticles;
            }),
            error: ((errorResponse: HttpErrorResponse) => {
              if (errorResponse.error && errorResponse.error.message) {
                this._snackBar.open(errorResponse.error.message);
              } else {
                this._snackBar.open('Ошибка получения данных связанных статей!');
              }
            })
          })
      }),
      error: ((errorResponse: HttpErrorResponse) => {
        if (errorResponse.error && errorResponse.error.message) {
          this._snackBar.open(errorResponse.error.message);
        } else {
          this._snackBar.open('Ошибка получения данных url-адреса!');
        }
      })
    })
  }

  getFirstComments(params: {offset: number, article: string}) {
    this.comments = [];
    this.totalCountComments = 0;
    this.noComments = false;
    this.noMoreComments = false;

    this.commentsService.getCommentsForArticle(params)
      .subscribe((data) => {
        if (data.allCount && data.allCount > 0) {
          this.totalCountComments = data.allCount;
        }
        if (data.comments && data.comments.length > 0) {

          if (this.totalCountComments && this.totalCountComments > 3) {
            for (let i = 0; i < 3; i++) {
              this.comments.push({
                id: data.comments[i].id,
                text: data.comments[i].text,
                date: data.comments[i].date,
                likesCount: data.comments[i].likesCount,
                dislikesCount: data.comments[i].dislikesCount,
                user:
                  {
                    id: data.comments[i].user.id,
                    name: data.comments[i].user.name
                  }
              })
            }
          } else if (this.totalCountComments && this.totalCountComments <= 3) {
            this.comments = data.comments;
            this.noMoreComments = true;
          } else if (this.totalCountComments === 0) {
            this.noMoreComments = true;
            this.noComments = true;
          }
        } else {
          this.noMoreComments = true;
          this.noComments = true;
        }
      })
  }

  getMoreComments() {
    this.loader.show();
    let lengthArrayComments: number = this.comments.length;
    const params = {offset: lengthArrayComments, article: this.article.id};
    this.commentsService.getCommentsForArticle(params)
      .subscribe({
        next: ((data) => {
          if (data.comments && data.comments.length > 0) {

            if (data.comments.length >= 10) {
              for (let i = 0; i <= 9; i++) {
                this.comments.push({
                  id: data.comments[i].id,
                  text: data.comments[i].text,
                  date: data.comments[i].date,
                  likesCount: data.comments[i].likesCount,
                  dislikesCount: data.comments[i].dislikesCount,
                  user:
                    {
                      id: data.comments[i].user.id,
                      name: data.comments[i].user.name
                    }
                })
              }
            } else if (data.comments.length < 10) {
              data.comments.forEach(item => {
                this.comments.push(item);
              })
              if (this.totalCountComments === this.comments.length) {
                this.noMoreComments = true;
              } else {
                this.noMoreComments = false;
              }
            }
          }

        }),
        error: ((errorResponse: HttpErrorResponse) => {
          if (errorResponse.error && errorResponse.error.message) {
            this._snackBar.open(errorResponse.error.message);
          } else {
            this._snackBar.open('Ошибка получения дополнительных комментариев!');
          }
        })
      })
  }

  sendComment(value: string | null | undefined) {
    console.log(value)
    if (value) {
      const params = {
        text: value,
        article: this.article.id
      }
      this.articlesService.addComment(params)
        .subscribe({
          next: ((data: DefaultResponseType) => {
            if (!data.error && data.message) {
              this._snackBar.open(data.message);
              this.textComment = '';
              this.router.navigate(['/articles/' + this.article.url]);

              const params = {offset: 0, article: this.article.id};
              this.getFirstComments(params);

            } else {
              this._snackBar.open(data.message);
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
    } else {
      this._snackBar.open('Необходимо ввести текст комментария!');
    }

  }

}
