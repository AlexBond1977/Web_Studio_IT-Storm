import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {finalize, Observable} from "rxjs";
import {environment} from "../../../environments/environment";
import {LoaderService} from "./loader.service";
import {DefaultResponseType} from "../../../types/default-response.type";
import {CommentReactionType} from "../../../types/comment-reaction.type";
import {CommentReactionResponseType} from "../../../types/comment-reaction-response.type";
import {CommentsType} from "../../../types/comments.type";

@Injectable({
  providedIn: 'root'
})
export class CommentsService {

  constructor(private http: HttpClient,
              private loaderService: LoaderService
              ) { }

  getCommentsForArticle (params: { offset: number, article: string }): Observable<CommentsType> {
    this.loaderService.show();
    return this.http.get<CommentsType>(environment.api + 'comments', {
      params: params
    })
      .pipe(
        finalize(() => this.loaderService.hide())
      );
  }

  applyReactionToComment(idComment: string, reaction: CommentReactionType): Observable<DefaultResponseType> {
    return this.http.post<DefaultResponseType>(environment.api + 'comments/' + idComment + '/apply-action', {
      action: reaction
    }, {headers: {}, withCredentials: true, })

  }

  getReactionsForComment(idComment: string):  Observable<CommentReactionResponseType> {
    return this.http.get<CommentReactionResponseType>(environment.api + 'comments/' + idComment + '/actions')
  }

  getUserReactions(articleId: string):  Observable<CommentReactionResponseType[]> {
    return this.http.get<CommentReactionResponseType[]>(environment.api + 'comments/article-comment-actions?articleId=' + articleId)
  }


}
