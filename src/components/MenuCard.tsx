import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
  is_fast_selling?: boolean;
  food_type?: string;
  images?:any
}

const MenuCard = ({
  name,
  description,
  price,
  discounted_price,
  image_url,
  combo_offers,
  is_fast_selling,
  food_type,
  images,
}: MenuCardProps) => {
  return (
    <Card className="p-3 hover:bg-muted/30 transition-all duration-200 rounded-lg shadow-sm">
      <div className="flex items-start gap-3">
        {/* Image */}
        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              No Image
            </div>
          )}
          {is_fast_selling && (
            <Badge className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1 py-0">
              🔥
            </Badge>
          )}
          {food_type && (
            <Badge className="absolute top-1 right-1 bg-background/80 text-[10px] px-1 py-0">
              {food_type === "veg" ? "🌱" : "🍖"}
            </Badge>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col w-full text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-left">{name}</h3>
            {discounted_price ? (
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold text-primary">
                  ${discounted_price.toFixed(2)}
                </span>
                <span className="ml-2 text-xs text-muted-foreground line-through">
                  ${price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-primary">
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}

          {combo_offers && combo_offers.length > 0 && (
            <div className="mt-1 space-y-0.5">
              <p className="text-[11px] font-semibold text-accent">
                Combo Offers:
              </p>
              {combo_offers.map((combo, idx) => (
                <p key={idx} className="text-[11px] text-muted-foreground">
                  {combo.combo_name} - ${combo.combo_price.toFixed(2)}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MenuCard;
