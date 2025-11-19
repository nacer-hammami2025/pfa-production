import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appAdminOnly]'
})
export class AdminOnlyDirective implements OnInit {

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    
    if (user && user.role === 'admin') {
      // L'utilisateur est admin, afficher l'élément
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      // L'utilisateur n'est pas admin, masquer l'élément
      this.viewContainer.clear();
    }
  }
}