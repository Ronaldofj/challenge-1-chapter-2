import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}


interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return []; 
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: product } = await api.get(`products/${productId}`);
      const { data: productStock } = await api.get(`stock/${productId}`);

      const productIndex = cart.findIndex(product => product.id === productId);
      
      if (productIndex >= 0) {
        if (productStock.amount <= cart[productIndex].amount) {
          toast.error('Quantidade solicitada fora de estoque')
  
          return;
        }

        const newCart = cart;

        newCart[productIndex].amount += 1;

        setCart([...newCart]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

        return;
      }
      

      if (productStock.amount < 1) {
        toast.error('Quantidade solicitada fora de estoque')

        return;
      }

      setCart([
        ...cart,
        {...product, amount: 1}
      ]);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {...product, amount: 1}]));

    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const selectedProductIndex = cart.findIndex(product => product.id === productId);

      if (selectedProductIndex >= 0) {

        const newCart = cart;

        delete newCart[selectedProductIndex];

        setCart([...newCart]);
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount === 0) return;

      const selectedProductIndex = cart.findIndex(product => product.id === productId);
      const newCart = cart;

      if (selectedProductIndex >= 0) {
        if (cart[selectedProductIndex].amount > amount) {

          newCart[selectedProductIndex].amount = amount;

          setCart([...newCart]);
          
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

          return;
        }

        const { data: productStock } = await api.get(`stock/${productId}`);

        if (productStock.amount < amount) {
          toast.error('Quantidade solicitada fora de estoque');

          return;
        }

        newCart[selectedProductIndex].amount = amount;

        setCart([...newCart]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else {
        toast.error('Erro na alteração de quantidade do produto');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
