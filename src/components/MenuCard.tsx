import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ComboOffer {
  combo_name: string;
  combo_price: number;
}

interface MenuCardProps {
  name: string;
  description?: string;
  price: number;
  discounted_price?: number;
  image_url?: string;
  combo_offers?: ComboOffer[];
}

const MenuCard = ({ name, description, price, discounted_price, image_url, combo_offers }: MenuCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="aspect-video relative overflow-hidden bg-muted">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        {discounted_price && (
          <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
            Sale!
          </Badge>
        )}
      </div>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        {description && (
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          {discounted_price ? (
            <>
              <span className="text-2xl font-bold text-primary">${discounted_price.toFixed(2)}</span>
              <span className="text-lg text-muted-foreground line-through">${price.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-2xl font-bold text-primary">${price.toFixed(2)}</span>
          )}
        </div>
        {combo_offers && combo_offers.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-accent">Combo Offers:</p>
            {combo_offers.map((combo, idx) => (
              <div key={idx} className="text-sm text-muted-foreground">
                {combo.combo_name} - ${combo.combo_price.toFixed(2)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MenuCard;
