import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import Modal from 'bootstrap/js/dist/modal'
import { useForm } from 'react-hook-form'
import ClipLoader from 'react-spinners/ClipLoader'
const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;


function App() {
  const [products, setProducts] = useState([]); // 產品列表 
  const productDetailModal = useRef(null); // 產品Modal
  const productDetailModalInstance = useRef(null); // 產品Modal Instance
  const [tmpProduct, setTmpProduct] = useState({});
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartIsEmpty, setCartIsEmpty] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [productQty, setProductQty] = useState(1);
  const {register, handleSubmit, formState: {errors}} = useForm();
  const orderForm = document.querySelector('#orderForm');
  const [isWindowLoading, setIsWindowLoading] = useState(false);

  
  
  const getProducts = async () => {
    setIsWindowLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/products/all`);
      setProducts(res.data.products); 
    } catch (error) {
      console.error(error);
    }finally{
      setIsWindowLoading(false);
    }
  }

  useEffect(() => {
    getProducts();
    productDetailModalInstance.current = new Modal(productDetailModal.current, { backdrop:false });
    getCartInfo();
  }, []);

  const openProductDetailModal = (product) => {
    setTmpProduct(product);
    productDetailModalInstance.current.show();
  }

  const closeProductDetailModal = () => { 
    productDetailModalInstance.current.hide();
  } 

  const addSingleProductToCart = async (id) => {
    const addSingleProduct = {
      data: {
        product_id: id,
        qty: 1
      }
    }
    setIsWaiting(true);
    try {
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/cart`, addSingleProduct );
      await getCartInfo();
      setCartIsEmpty(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsWaiting(false);
    }
  }

  const addMultipleProductToCart = async (id, qty) => {
    const addMultipleProduct = {
      data: {
        product_id: id,
        qty: Number(qty)
      }
    }
    setIsWaiting(true);
    try {
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/cart`, addMultipleProduct);
      await getCartInfo();
      setCartIsEmpty(false);
      closeProductDetailModal();
    } catch (error) {
      console.error(error);
    } finally {
      setIsWaiting(false);
      //初始化下拉選單
      setProductQty(1);
    }
  }

  const getCartInfo = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/cart`);
      const cartData = res.data.data.carts;
      setCart(cartData);
      setCartTotal(res.data.data.final_total);
      cartData.length === 0 ? setCartIsEmpty(true) : setCartIsEmpty(false);
    } catch (error) {
      console.error(error);
    }
  }

  const deleteCartProduct = async () => {
    setIsWaiting(true);
    try {
      await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/carts`);
      await getCartInfo();
      setCartIsEmpty(true);
    } 
    catch (error) {
      console.error(error); 
    }finally{
      setIsWaiting(false);
    }
  }

  const cartOriginTotal = cart.reduce((acc,curr)=>{
      return curr.product.origin_price * curr.qty + acc
    }, 0)

  const submitOrder = async (data) => {
    const oderData = {
      data:{
        user:{
          name: data.name,
          email: data.email,
          tel: data.tel,
          address: data.address,
        },
        message: data.message,
      }
    }
    try {
      setIsWindowLoading(true);
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/order`, oderData);
      await getCartInfo();
      orderForm.reset();
      setIsWindowLoading(false);
    } catch (error) {
      console.log(error);
    } 
  }

  return (
        <div id="app">
          <div className="container py-4">
            <div className="mt-4">
              {/* 產品Modal */}
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>圖片</th>
                    <th>商品名稱</th>
                    <th>價格</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                {products.map((product) => {
                    return ( <tr key={product.id}>
                      <td style={{ width: '200px' }}>
                        <div >
                          <img style={{ height: '100px', backgroundSize: 'cover', backgroundPosition: 'center', objectFit: 'cover' }} src={product.imageUrl} alt={product.title}/>
                        </div>
                      </td>
                      <td>{product.title}</td>
                      <td>
                        <div className="h5">{`特價 ${product.price}`}</div>
                        <del className="h6">{product.origin_price}</del>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button type="button" className="btn btn-outline-secondary" onClick={()=>openProductDetailModal(product)}>
                            <i className="fas fa-spinner fa-pulse"></i>
                            查看更多
                          </button>
                          <button disabled={isWaiting} type="button" className="btn btn-outline-danger" onClick={()=>addSingleProductToCart(product.id)}>
                            <i className="fas fa-spinner fa-pulse" ></i>
                            加到購物車
                          </button>
                        </div>
                      </td>
                </tr>)
                })}
                </tbody>
              </table>
              {/* 查看更多Modal */}  
              <div ref={productDetailModal} className="modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}> 
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">{`產品名稱:${tmpProduct.title}`}</h5>
                      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={closeProductDetailModal}></button>
                    </div>
                    <div className="modal-body text-start">
                      <img className='mb-3' style={{objectFit:'cover', height:'300px' }}  src={tmpProduct.imageUrl} alt={tmpProduct.title} />
                      <div className='mb-3'>內容：{tmpProduct.content}</div>
                      <div className='mb-3'>描述：{tmpProduct.description}</div>
                      <div className='mb-3 d-flex'>
                        <div className='me-2 text-success'>價錢：{tmpProduct.price}</div>
                        <del>{tmpProduct.origin_price}</del>
                      </div>
                      <div className='input-group align-items-center mb-2'>
                        <div>數量：</div>
                        <select className='form-select' name="productQty" id="productQty" value={productQty} onChange={(e)=> setProductQty(e.target.value)}>
                          {[...Array(10)].map((_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary px-3" data-bs-dismiss="modal" onClick={closeProductDetailModal}>取消</button>
                      <button type="button" className="btn btn-primary px-3" disabled={isWaiting} onClick={()=>addMultipleProductToCart(tmpProduct.id, productQty)}>放入購物車</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-end mt-5 mb-2">
                <button className="btn btn-outline-danger" type="button" disabled={isWaiting || cartIsEmpty} onClick={deleteCartProduct}>
                  清空購物車 
                  { isWaiting && <ClipLoader color='#000' size={15}/>}
                  </button>
              </div>
              {cartIsEmpty ? <strong className="text-center fs-4">購物車是空的QAQ</strong> : ( <table className="table align-middle">
                  <thead>
                    <tr>
                      <th></th>
                      <th>品名</th>
                      <th style={{ width: '150px' }}>數量/單位</th>
                      <th>原價</th>
                      <th>單價</th>
                      <th>小計</th>
                    </tr>
                  </thead>
                  <tbody>
                  {cart.map((product) => {
                      return ( <tr key={product.id}>
                      <td style={{ width: '200px' }}>
                        <div>
                          <img style={{ height: '100px', backgroundSize: 'cover', backgroundPosition: 'center', objectFit: 'cover' }} src={product.product.imageUrl} alt={product.product.title}/>
                        </div>
                      </td>
                      <td>{product.product.title}</td>
                      <td>
                        <div className="h5">{product.qty}</div>
                      </td>
                      <td>
                        <div className="h5">{product.product.origin_price}</div>
                      </td>
                      <td>
                        <div className="h5">{`特價 ${product.product.price}`}</div>
                      </td>
                      <td>
                        <div className="h5">{product.final_total}</div>
                      </td>
                      </tr>)
                  })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td></td>
                      <td></td>
                      <td colSpan="3" className="text-end">總計</td>
                      <td className="text-end">
                      {cartOriginTotal}
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td colSpan="3" className="text-end text-success">折扣價</td>
                      <td className="text-end text-success">{cartTotal}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td colSpan="3" className="text-end text-danger">本次省下</td>
                      <td className="text-end text-danger">{cartOriginTotal - cartTotal}</td>
                    </tr>
                  </tfoot>
                </table>)}
            </div>

            <div className="my-5 row justify-content-center">
              <form className="col-md-6" id='orderForm' onSubmit= {handleSubmit((data)=>submitOrder(data))}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  className={`form-control ${errors?.email && "input-error is-invalid"}`} 
                  {...register('email', {
                    required:"Email 為必填",
                    pattern:{
                      value:/^\S+@\S+\.\S+$/,
                      message:"請輸入正確的 Email 格式"
                    }
                  })}
                  placeholder="請輸入 Email"/>
                  { errors.email && <p className='text-start invalid-feedback'>{errors.email?.message}</p> }
                </div>
    
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">收件人姓名</label>
                  <input 
                  id="name" 
                  name="姓名" 
                  type="text"
                  className={`form-control ${errors?.name && "input-error is-invalid"}`} 
                  placeholder="請輸入姓名" 
                  {...register("name", {
                    required:"姓名為必填",
                  })}/>
                   { errors.name && <p className='text-start invalid-feedback'>{errors.name?.message}</p> }
                </div>
    
                <div className="mb-3">
                  <label htmlFor="tel" className="form-label">收件人電話</label>
                  <input 
                  id="tel" 
                  name="電話" 
                  type="tel" 
                  className={`form-control ${errors?.tel && "input-error is-invalid"}`} 
                  {...register("tel", {
                    required: "電話為必填",
                    validate: {
                      maxLength: (value) => value.length <= 8 || "電話最多 8 碼",
                      isNumber: (value) => /^\d+$/.test(value) || "電話必須為數字"
                    }
                  })}
                  placeholder="請輸入電話" />
                  { errors.tel && <p className='text-start invalid-feedback'>{errors.tel?.message}</p> }
                </div>
    
                <div className="mb-3">
                  <label htmlFor="address" className="form-label">收件人地址</label>
                  <input 
                  id="address" 
                  name="地址" 
                  type="text" 
                  className={`form-control ${errors?.address && "input-error is-invalid"}`} 
                  {...register("address", {
                    required:"地址為必填",
                  })}
                  placeholder="請輸入地址" />
                  { errors.address && <p className='text-start invalid-feedback'>{errors.address?.message}</p> }
                </div>
    
                <div className="mb-3">
                  <label htmlFor="message" className="form-label">留言</label>
                  <textarea id="message"
                   className={`form-control ${errors?.message && "input-error is-invalid"}`} 
                    cols="30" 
                    rows="10"
                    {...register("message", {
                      validate: {
                        maxLength: (value) => value.length <= 250 || "留言最多 250 字"
                      }
                    })}
                    ></textarea>
                    { errors.message && <p className='text-start invalid-feedback'>{errors.message?.message}</p> }
                </div>
                <div className="text-end">
                  <button type="submit" className="btn btn-danger" disabled={cartIsEmpty}>送出訂單</button>
                  { cartIsEmpty && <div className='text-danger mt-1'>結帳時購物車至少有一商品！</div> }
                </div>
              </form>
            </div>
            
          </div>
          {isWindowLoading && (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(255,255,255,0.3)",
                zIndex: 999,
              }}>
              <ClipLoader color="black" size={50} />
            </div>
          )}
        </div>
      );
  }
    


export default App
