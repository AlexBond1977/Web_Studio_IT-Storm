import {AfterViewChecked, Component, OnInit} from '@angular/core';
import {ArticlesService} from "../../../shared/services/articles.service";
import {ArticlesFiltersType} from "../../../../types/articles-filters.type";
import {ArticlesAllType} from "../../../../types/articles-all.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ArticleType} from "../../../../types/article.type";
import {CategoriesType} from "../../../../types/categories.type";
import {CategoriesService} from "../../../shared/services/categories.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit, AfterViewChecked {
  filtersOpen: boolean = false;
  activeParams: ArticlesFiltersType = {};
  articles: ArticleType[] = [];
  categories: CategoriesType[] = [];
  iconsFilters: {
    name: string,
    url: string
  }[] = [];
  pages: number[] = [];

  constructor(private articlesService: ArticlesService,
              private _snackBar: MatSnackBar,
              private categoriesService: CategoriesService,
              private router: Router,
              private activatedRoute: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.categoriesService.getCategories()

      .subscribe({
        next: ((data: CategoriesType[]) => {
          this.categories = data;

          this.activatedRoute.queryParams.subscribe({
            next: ((data) => {

              const activeParams: ArticlesFiltersType = {};
              if (data.hasOwnProperty('categories')) {
                activeParams.categories = Array.isArray(data['categories']) ? data['categories'] : [data['categories']];
              }

              if (data.hasOwnProperty('page')) {
                activeParams.page = data['page'];
              }

              this.activeParams = activeParams;

              this.articlesService.getArticles(this.activeParams)
                .subscribe({
                  next: ((data: ArticlesAllType) => {
                    this.pages = [];
                    for (let i = 1; i <= data.pages; i++) {
                      this.pages.push(i);
                    }

                    this.articles = data.items;
                  }),
                  error: ((error: DefaultResponseType) => {
                    if (error.message) {
                      this._snackBar.open(error.message)
                    } else {
                      this._snackBar.open("Ошибка получения данных");
                    }
                  })
                })

              this.iconsFilters = [];
              this.activeParams.categories?.forEach(url => {

                const foundCategory = this.categories.find(item => item.url === url);
                if (foundCategory) {
                  this.iconsFilters.push({
                    name: foundCategory.name,
                    url: foundCategory.url
                  })
                }
              })
            }),
            error: ((error: DefaultResponseType) => {
              if (error.message) {
                this._snackBar.open(error.message)
              } else {
                this._snackBar.open("Ошибка получения категорий");
              }
            })
          })
        }),
        error: ((error: DefaultResponseType) => {
          if (error.message) {
            this._snackBar.open(error.message)
          } else {
            this._snackBar.open("Ошибка получения категорий");
          }
        })
      })
  }

  ngAfterViewChecked() {
    if (this.activeParams.categories) {
      this.activeParams.categories.forEach(item => {
        const categoryFromQueryParams = document.getElementById(item);
        if (categoryFromQueryParams) {
          categoryFromQueryParams.classList.add('active');
        }
      })
    }

    let arrayCategoryNotInActiveParams: string[] = [];
    this.categories.forEach(item => {
      if (!this.activeParams.categories?.includes(item.url)) {
        arrayCategoryNotInActiveParams.push(item.url);
      }
    })
    arrayCategoryNotInActiveParams.forEach(item => {
      let itemFromArray = document.getElementById(item);
      if (itemFromArray) {
        itemFromArray.classList.remove('active');
      }
    })

  }

  toggleFilters() {
    this.filtersOpen = !this.filtersOpen;
  }

  openPage(page: number) {
    this.activeParams.page = page;
    this.router.navigate(['/blog'], {
      queryParams: this.activeParams
    });
  }

  openPrevPage() {
    if (this.activeParams.page && this.activeParams.page > 1) {
      this.activeParams.page--;
      this.router.navigate(['/blog'], {
        queryParams: this.activeParams
      });
    }
  }

  openNextPage() {
    if (this.activeParams.page && this.activeParams.page < this.pages.length) {
      this.activeParams.page++;
      this.router.navigate(['/blog'], {
        queryParams: this.activeParams
      });
    } else {
      this.activeParams.page = 1;
      this.activeParams.page++;
      this.router.navigate(['/blog'], {
        queryParams: this.activeParams
      });
    }
  }

  updateFilterParam(url: string, filterItemElement: HTMLElement) {
    if (this.activeParams.categories && this.activeParams.categories.length > 0) {
      const existingCategoryInParams = this.activeParams.categories.find(item => item === url);
      if (existingCategoryInParams) {
        this.activeParams.categories = this.activeParams.categories.filter(item => item !== url);
        filterItemElement.classList.remove('active');

      } else if (!existingCategoryInParams) {
        this.activeParams.categories = [...this.activeParams.categories, url];
        filterItemElement.classList.add('active');
      }
    } else {
      this.activeParams.categories = [url];
      filterItemElement.classList.add('active');
    }

    this.activeParams.page = 1;
    this.router.navigate(['/blog'], {
      queryParams: this.activeParams
    });
  }

  removeIconFilter(url: string) {
    this.activeParams.categories = this.activeParams.categories?.filter(item => item !== url);
    this.activeParams.page = 1;
    this.router.navigate(['/blog'], {
      queryParams: this.activeParams
    })

    if (this.activeParams.categories) {
      this.activeParams.categories.forEach(item => {
        const categoryFromQueryParams = document.getElementById(item);

        if (categoryFromQueryParams) {
          categoryFromQueryParams.classList.add('active');
        } else {
          return;
        }
      })
    }
  }
}
