import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { RaccomandazioniService } from '../../core/services/raccomandazioni.service';
import { ScanService } from '../../core/services/scan.service';
import { Cart } from '../../shared/model/cart';
import { Product } from '../../shared/model/product';
import { CarrelloService } from '../carrello.service';
import { AlertService } from 'src/app/core/services/alert.service';

@Component({
  selector: 'app-carrello-page',
  templateUrl: './carrello-page.component.html',
  styleUrls: ['./carrello-page.component.scss'],
})
// tslint:disable: align
export class CarrelloPageComponent implements OnInit, OnDestroy {
  cart: Cart;
  recommendationsNumber: number;
  private routeSubscription: Subscription;

  constructor(private carrelloService: CarrelloService,
    private scanService: ScanService,
    private raccomandazioniService: RaccomandazioniService,
    private toastService: ToastService,
    private alertService: AlertService,
    private router: Router,
    private activatedRoute: ActivatedRoute) {
    this.cart = this.carrelloService.makeEmptyCart();
    this.recommendationsNumber = 0;
  }

  ngOnInit() {
    this.routeSubscription = this.activatedRoute.data.subscribe({
      next: () => {
        if (history.state.item) {
          this.carrelloService.addItem(this.cart, history.state.item);
          this.getNewRecommendation();
        }
      }
    });
  }

  ngOnDestroy() {
    this.routeSubscription.unsubscribe();
  }

  public activateCart() {
    this.carrelloService.activateCart(this.cart);
  }

  public checkout() {
    this.alertService.presentConfirm('Procedere al checkout?', [
      {
        text: 'Annulla',
        role: 'cancel',
      },
      {
        text: 'Conferma',
        handler: () => {
          this.carrelloService.checkout(this.cart);
        }
      }
    ]);
  }

  public getTotalPrice(): number {
    return this.carrelloService.getTotalPrice(this.cart);
  }

  public getTotalQuantity(): number {
    return this.carrelloService.getTotalQuantity(this.cart);
  }

  public deleteItem(index: number) {
    this.carrelloService.deleteItem(this.cart, index);
  }

  public increaseItem(index: number) {
    this.carrelloService.increaseItem(this.cart, index);
  }

  public decreaseItem(index: number) {
    this.carrelloService.decreaseItem(this.cart, index);
  }

  public navigateToScan() {
    this.scanService.startNormalScan()
      .then((barcode: string) => {
        if (barcode) {
          this.router.navigateByUrl('/articolo/' + barcode, { state: { scan: true } });
        } else {
          console.log('Empty barcode');
        }
      })
      .catch(reason => console.log('Scan failed: ' + reason));
  }

  public navigateToRaccomandazioni() {
    this.recommendationsNumber = 0;
    this.router.navigateByUrl('index/carrello/raccomandazioni');
  }

  /**
   * Get a recommendation from the server
   */
  private getNewRecommendation(): void {
    const productsInCart: Product[] = this.cart.getItems()
      .map(value => value.getProduct());
    this.raccomandazioniService.getNewRecommendation(productsInCart)
      .then(recomm => {
        if (recomm) {
          // TODO: Improve toast
          this.toastService.presentToast('C\'è una raccomandazione per te!', 2000, true, 'success', true);
          this.recommendationsNumber++;
        }
      });
  }
}
