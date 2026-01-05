"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchAPI, uploadFile, STRAPI_URL } from "../../lib/api";

interface StrapiImage {
  id: number;
  url: string;
}

interface ProductAttribute {
  documentId: string;
  name: string;
  inputType: string;
  values?: string[];
}

interface Category {
  documentId: string;
  name: string;
  attributes?: ProductAttribute[];
}

interface Brand {
  documentId: string;
  name: string;
}

interface Manufacturer {
  documentId: string;
  name: string;
}

interface Variant {
  id?: number;
  documentId?: string;
  variantName: string;
  sku: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  images?: StrapiImage[];
  // For UI state tracking
  imageFiles?: File[];
  imagePreviews?: string[];
  attributeValues: Record<string, string>;
}

interface Product {
  documentId: string;
  name: string;
  sku: string;
  stockQuantity: number;
  baseUnit: string;
  purchaseUnit: string;
  saleUnit: string;
  purchaseToSaleFactor: number;
  saleToBaseFactor: number;
  costPrice: number;
  sellingPrice: number;
  description?: string;
  attributeValues?: Record<string, string>;
  alertLevel?: number;
  image?: StrapiImage | null;
  gallery?: StrapiImage[];
  category?: Category;
  subCategory?: Category;
  childCategory?: Category;
  brand?: Brand;
  manufacturer?: Manufacturer;
  variants?: Variant[];
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Media State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    subCategory: "",
    childCategory: "",
    brand: "",
    manufacturer: "",
    baseUnit: "Pcs",
    purchaseUnit: "Pcs",
    saleUnit: "Pcs",
    purchaseToSaleFactor: 1,
    saleToBaseFactor: 1,
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    alertLevel: 10,
    description: "",
    attributeValues: {} as Record<string, string>,
    image: null as StrapiImage | null,
    gallery: [] as StrapiImage[],
    variants: [] as Variant[],
  });

  // Quick Attribute Modal State
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [attrFormData, setAttrFormData] = useState({
    name: "",
    inputType: "Text",
    values: [] as string[],
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI("/products?populate=*");
      if (res.data) setProducts(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetchAPI(
        "/product-categories?populate=*&sort=name:ASC"
      );
      if (res.data) setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBrands = async () => {
    try {
      const res = await fetchAPI("/product-brands?sort=name:ASC");
      if (res.data) setBrands(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadManufacturers = async () => {
    try {
      const res = await fetchAPI("/product-manufacturers?sort=name:ASC");
      if (res.data) setManufacturers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubCategories = async (catId: string) => {
    try {
      const res = await fetchAPI(
        `/product-sub-categories?filters[category][documentId][$eq]=${catId}&sort=name:ASC`
      );
      setSubCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadChildCategories = async (subId: string) => {
    try {
      const res = await fetchAPI(
        `/product-child-categories?filters[subCategory][documentId][$eq]=${subId}&sort=name:ASC`
      );
      setChildCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
    loadManufacturers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      subCategory: "",
      childCategory: "",
      brand: "",
      manufacturer: "",
      baseUnit: "Pcs",
      purchaseUnit: "Pcs",
      saleUnit: "Pcs",
      purchaseToSaleFactor: 1,
      saleToBaseFactor: 1,
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      alertLevel: 10,
      description: "",
      attributeValues: {},
      image: null,
      gallery: [],
      variants: [],
    });
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setSubCategories([]);
    setChildCategories([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(file);
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...galleryFiles, ...files];
      setGalleryFiles(newFiles);

      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setGalleryPreviews([...galleryPreviews, ...newPreviews]);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newFiles = galleryFiles.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setGalleryFiles(newFiles);
    setGalleryPreviews(newPreviews);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (product: any) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category?.documentId || "",
      subCategory: product.subCategory?.documentId || "",
      childCategory: product.childCategory?.documentId || "",
      brand: product.brand?.documentId || "",
      manufacturer: product.manufacturer?.documentId || "",
      baseUnit: product.baseUnit || "Pcs",
      purchaseUnit: product.purchaseUnit || "Pcs",
      saleUnit: product.saleUnit || "Pcs",
      purchaseToSaleFactor: product.purchaseToSaleFactor || 1,
      saleToBaseFactor: product.saleToBaseFactor || 1,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      alertLevel: product.alertLevel || 10,
      description: product.description || "",
      attributeValues: product.attributeValues || {},
      image: product.image || null,
      gallery: product.gallery || [],
      variants: product.variants || [],
    });
    setEditingId(product.documentId);
    if (product.image?.url) {
      setImagePreview(`${STRAPI_URL}${product.image.url}`);
    } else {
      setImagePreview("");
    }

    if (product.gallery && product.gallery.length > 0) {
      setGalleryPreviews(
        product.gallery.map((img: StrapiImage) => `${STRAPI_URL}${img.url}`)
      );
    } else {
      setGalleryPreviews([]);
    }

    if (product.category?.documentId)
      loadSubCategories(product.category.documentId);
    if (product.subCategory?.documentId)
      loadChildCategories(product.subCategory.documentId);

    setImageFile(null);
    setGalleryFiles([]);
    setIsModalOpen(true);
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          variantName: "",
          sku: "",
          price: formData.sellingPrice,
          costPrice: formData.costPrice,
          stockQuantity: 0,
          attributeValues: {},
          imageFiles: [],
          imagePreviews: [],
        },
      ],
    });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const handleVariantGalleryChange = (
    variantIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newVariants = [...formData.variants];
      const variant = newVariants[variantIndex];

      const currentFiles = variant.imageFiles || [];
      const currentPreviews = variant.imagePreviews || [];

      variant.imageFiles = [...currentFiles, ...files];
      variant.imagePreviews = [
        ...currentPreviews,
        ...files.map((f) => URL.createObjectURL(f)),
      ];

      setFormData({ ...formData, variants: newVariants });
    }
  };

  const removeVariantGalleryImage = (
    variantIndex: number,
    imgIndex: number
  ) => {
    const newVariants = [...formData.variants];
    const variant = newVariants[variantIndex];

    variant.imageFiles = variant.imageFiles?.filter((_, i) => i !== imgIndex);
    variant.imagePreviews = variant.imagePreviews?.filter(
      (_, i) => i !== imgIndex
    );

    setFormData({ ...formData, variants: newVariants });
  };

  const removeVariant = (index: number) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetchAPI(`/products/${documentId}`, { method: "DELETE" });
      loadProducts();
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // 1. Upload Main Image
      let imageId = formData.image?.id;
      if (imageFile) {
        const uploaded = await uploadFile(imageFile);
        imageId = uploaded.id;
      }

      // 2. Upload Gallery Images
      const galleryIds = formData.gallery?.map((img) => img.id) || [];
      if (galleryFiles.length > 0) {
        for (const file of galleryFiles) {
          const uploaded = await uploadFile(file);
          galleryIds.push(uploaded.id);
        }
      }

      // 3. Prepare Product Payload
      const productPayload = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category || null,
        subCategory: formData.subCategory || null,
        childCategory: formData.childCategory || null,
        brand: formData.brand || null,
        manufacturer: formData.manufacturer || null,
        baseUnit: formData.baseUnit,
        purchaseUnit: formData.purchaseUnit,
        saleUnit: formData.saleUnit,
        purchaseToSaleFactor: formData.purchaseToSaleFactor,
        saleToBaseFactor: formData.saleToBaseFactor,
        costPrice: formData.costPrice,
        sellingPrice: formData.sellingPrice,
        stockQuantity: formData.stockQuantity,
        alertLevel: formData.alertLevel,
        description: formData.description,
        attributeValues: formData.attributeValues,
        image: imageId || null,
        gallery: galleryIds,
      };

      let productDocId: string;

      if (editingId) {
        const res = await fetchAPI(`/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ data: productPayload }),
        });
        productDocId = res.data.documentId;
      } else {
        const res = await fetchAPI("/products", {
          method: "POST",
          body: JSON.stringify({ data: productPayload }),
        });
        productDocId = res.data.documentId;
      }

      // 4. Handle Variants
      if (formData.variants.length > 0) {
        for (const variant of formData.variants) {
          // Upload variant images
          const varImageIds = variant.images?.map((img) => img.id) || [];
          if (variant.imageFiles && variant.imageFiles.length > 0) {
            for (const vfile of variant.imageFiles) {
              const vuploaded = await uploadFile(vfile);
              varImageIds.push(vuploaded.id);
            }
          }

          const variantPayload = {
            variantName: variant.variantName,
            sku: variant.sku,
            price: variant.price,
            costPrice: variant.costPrice,
            stockQuantity: variant.stockQuantity,
            attributeValues: variant.attributeValues,
            images: varImageIds,
            product: productDocId, // Link to product
          };

          if (variant.documentId) {
            await fetchAPI(`/product-variants/${variant.documentId}`, {
              method: "PUT",
              body: JSON.stringify({ data: variantPayload }),
            });
          } else {
            await fetchAPI("/product-variants", {
              method: "POST",
              body: JSON.stringify({ data: variantPayload }),
            });
          }
        }
      }

      setIsModalOpen(false);
      resetForm();
      loadProducts();
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find(
    (c) => c.documentId === formData.category
  );
  const relevantAttributes = selectedCategory?.attributes || [];

  const handleAttributeChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      attributeValues: {
        ...formData.attributeValues,
        [name]: value,
      },
    });
  };

  const handleQuickAttrSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      alert("Please select a category first to link this attribute.");
      return;
    }
    try {
      // 1. Create Attribute
      const attrRes = await fetchAPI("/product-attributes", {
        method: "POST",
        body: JSON.stringify({
          data: {
            name: attrFormData.name,
            inputType: attrFormData.inputType,
            values:
              attrFormData.inputType === "Select"
                ? attrFormData.values.filter((v) => v.trim() !== "")
                : null,
          },
        }),
      });

      // 2. Link to Category
      const currentCat = categories.find(
        (c) => c.documentId === formData.category
      );
      const existingAttrs =
        currentCat?.attributes?.map((a) => a.documentId) || [];

      await fetchAPI(`/product-categories/${formData.category}`, {
        method: "PUT",
        body: JSON.stringify({
          data: {
            attributes: [...existingAttrs, attrRes.data.documentId],
          },
        }),
      });

      // 3. Refresh
      await loadCategories();
      setIsAttrModalOpen(false);
      setAttrFormData({ name: "", inputType: "Text", values: [] });
    } catch (err: any) {
      alert("Failed to add attribute: " + err.message);
    }
  };

  if (loading) return <div className="p-8">Loading Inventory...</div>;

  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          Inventory Management
        </h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Add Product
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr
              style={{
                background: "rgba(0,0,0,0.02)",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <th style={{ padding: "1rem" }}>Product</th>
              <th style={{ padding: "1rem" }}>Brand & Category</th>
              <th style={{ padding: "1rem" }}>Stock</th>
              <th style={{ padding: "1rem" }}>Status</th>
              <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => (
              <tr
                key={item.documentId}
                style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
              >
                <td style={{ padding: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    {item.image?.url ? (
                      <Image
                        src={`${STRAPI_URL}${item.image.url}`}
                        alt={item.name}
                        width={40}
                        height={40}
                        style={{ borderRadius: "0.25rem", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: "#f1f5f9",
                          borderRadius: "0.25rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                        }}
                      >
                        N/A
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#64748b",
                          fontFamily: "monospace",
                        }}
                      >
                        {item.sku}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "#3b82f6",
                    }}
                  >
                    {item.brand?.name || "No Brand"}
                  </div>
                  <div style={{ fontSize: "0.85rem" }}>
                    {item.category?.name || "General"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    {item.subCategory?.name ? `→ ${item.subCategory.name}` : ""}
                  </div>
                </td>
                <td style={{ padding: "1rem" }}>
                  <div style={{ fontWeight: 700 }}>
                    {item.stockQuantity} {item.baseUnit}
                  </div>
                </td>
                <td style={{ padding: "1rem" }}>
                  <span
                    style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "1rem",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background:
                        item.stockQuantity > (item.alertLevel || 10)
                          ? "#ecfdf5"
                          : "#fef2f2",
                      color:
                        item.stockQuantity > (item.alertLevel || 10)
                          ? "#059669"
                          : "#ef4444",
                    }}
                  >
                    {item.stockQuantity > (item.alertLevel || 10)
                      ? "IN STOCK"
                      : "LOW STOCK"}
                  </span>
                </td>
                <td style={{ padding: "1rem", textAlign: "right" }}>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="btn-icon"
                    style={{ color: "#3b82f6", marginRight: "0.5rem" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.documentId)}
                    className="btn-icon"
                    style={{ color: "#ef4444" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "2rem",
          }}
        >
          <div
            className="glass-panel"
            style={{
              background: "white",
              padding: "2.5rem",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginBottom: "2rem" }}>
              {editingId ? "Edit Product" : "New Universal Product"}
            </h2>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              {/* Part 1: Classification */}
              <div
                style={{
                  background: "#f8fafc",
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  border: "1px solid #e2e8f0",
                }}
              >
                <h3
                  style={{
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#64748b",
                    marginBottom: "1rem",
                  }}
                >
                  1. Product Classification
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <select
                      className="form-input"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b.documentId} value={b.documentId}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manufacturer</label>
                    <select
                      className="form-input"
                      value={formData.manufacturer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          manufacturer: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Manufacturer</option>
                      {manufacturers.map((m) => (
                        <option key={m.documentId} value={m.documentId}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Main Category</label>
                    <select
                      required
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          category: e.target.value,
                          subCategory: "",
                          childCategory: "",
                          attributeValues: {},
                        });
                        loadSubCategories(e.target.value);
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.documentId} value={c.documentId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sub-Category</label>
                    <select
                      className="form-input"
                      disabled={!formData.category}
                      value={formData.subCategory}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          subCategory: e.target.value,
                          childCategory: "",
                        });
                        loadChildCategories(e.target.value);
                      }}
                    >
                      <option value="">Select Sub-Category</option>
                      {subCategories.map((s) => (
                        <option key={s.documentId} value={s.documentId}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Child-Category</label>
                    <select
                      className="form-input"
                      disabled={!formData.subCategory}
                      value={formData.childCategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          childCategory: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Child-Category</option>
                      {childCategories.map((cc) => (
                        <option key={cc.documentId} value={cc.documentId}>
                          {cc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Part 2: Dynamic Attributes */}
              <div
                style={{
                  background: "#fffbeb",
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  border: "1px solid #fef3c7",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#b45309",
                      margin: 0,
                    }}
                  >
                    2. Specific Attributes (Dynamic)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAttrModalOpen(true)}
                    disabled={!formData.category}
                    style={{
                      padding: "0.25rem 0.75rem",
                      background: "#f59e0b",
                      color: "white",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      opacity: formData.category ? 1 : 0.5,
                    }}
                  >
                    + Add New Input Field
                  </button>
                </div>

                {relevantAttributes.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1.5rem",
                    }}
                  >
                    {relevantAttributes.map((attr) => (
                      <div key={attr.documentId} className="form-group">
                        <label className="form-label">{attr.name}</label>
                        {attr.inputType === "Select" ? (
                          <select
                            className="form-input"
                            value={formData.attributeValues[attr.name] || ""}
                            onChange={(e) =>
                              handleAttributeChange(attr.name, e.target.value)
                            }
                          >
                            <option value="">Select {attr.name}</option>
                            {attr.values?.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={
                              attr.inputType === "Date"
                                ? "date"
                                : attr.inputType === "Number"
                                ? "number"
                                : "text"
                            }
                            className="form-input"
                            value={formData.attributeValues[attr.name] || ""}
                            onChange={(e) =>
                              handleAttributeChange(attr.name, e.target.value)
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#92400e",
                      fontSize: "0.85rem",
                      fontStyle: "italic",
                    }}
                  >
                    {formData.category
                      ? "No specific attributes linked to this category yet. Click '+' to add one."
                      : "Please select a category above to see or add specific attributes."}
                  </div>
                )}
              </div>

              {/* Part 3: Basic Details */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Code</label>
                  <input
                    className="form-input"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Main Image</label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="form-input"
                  accept="image/*"
                />
                {imagePreview && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      position: "relative",
                      width: "100px",
                      height: "100px",
                    }}
                  >
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      style={{ objectFit: "cover", borderRadius: "0.5rem" }}
                      unoptimized
                    />
                  </div>
                )}
              </div>

              {/* Gallery Images */}
              <div className="form-group">
                <label className="form-label">Gallery Images (Multi)</label>
                <input
                  type="file"
                  multiple
                  onChange={handleGalleryChange}
                  className="form-input"
                  accept="image/*"
                />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {galleryPreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: "80px",
                        height: "80px",
                      }}
                    >
                      <Image
                        src={preview}
                        alt={`Gallery ${idx}`}
                        fill
                        style={{ objectFit: "cover", borderRadius: "0.5rem" }}
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          fontSize: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Base Unit</label>
                  <input
                    className="form-input"
                    value={formData.baseUnit}
                    onChange={(e) =>
                      setFormData({ ...formData, baseUnit: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost Price</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPrice: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellingPrice: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Stock</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* Part 5: Product Variants */}
              <div
                style={{
                  background: "#f0f9ff",
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  border: "1px solid #e0f2fe",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#0369a1",
                      margin: 0,
                    }}
                  >
                    5. Product Variants (Optional)
                  </h3>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="btn"
                    style={{
                      padding: "0.4rem 1rem",
                      fontSize: "0.8rem",
                      background: "#0ea5e9",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span>+</span> Add Variant
                  </button>
                </div>

                {formData.variants.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    {formData.variants.map((v, vIdx) => (
                      <div
                        key={vIdx}
                        style={{
                          background: "white",
                          padding: "1.5rem",
                          borderRadius: "1rem",
                          border: "1px solid #bae6fd",
                          position: "relative",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => removeVariant(vIdx)}
                          style={{
                            position: "absolute",
                            top: "1rem",
                            right: "1rem",
                            color: "#ef4444",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          Remove
                        </button>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "1rem",
                            marginBottom: "1rem",
                          }}
                        >
                          <div className="form-group">
                            <label className="form-label">
                              Variant Name (e.g. Red, XL)
                            </label>
                            <input
                              className="form-input"
                              value={v.variantName}
                              onChange={(e) =>
                                updateVariant(
                                  vIdx,
                                  "variantName",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Variant SKU</label>
                            <input
                              className="form-input"
                              value={v.sku}
                              onChange={(e) =>
                                updateVariant(vIdx, "sku", e.target.value)
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Variant Stock</label>
                            <input
                              type="number"
                              className="form-input"
                              value={v.stockQuantity}
                              onChange={(e) =>
                                updateVariant(
                                  vIdx,
                                  "stockQuantity",
                                  parseFloat(e.target.value)
                                )
                              }
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                            marginBottom: "1rem",
                          }}
                        >
                          <div className="form-group">
                            <label className="form-label">Selling Price</label>
                            <input
                              type="number"
                              className="form-input"
                              value={v.price}
                              onChange={(e) =>
                                updateVariant(
                                  vIdx,
                                  "price",
                                  parseFloat(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Cost Price</label>
                            <input
                              type="number"
                              className="form-input"
                              value={v.costPrice}
                              onChange={(e) =>
                                updateVariant(
                                  vIdx,
                                  "costPrice",
                                  parseFloat(e.target.value)
                                )
                              }
                            />
                          </div>
                        </div>

                        {/* Variant Gallery */}
                        <div className="form-group">
                          <label className="form-label">
                            Variant Images (Multi)
                          </label>
                          <input
                            type="file"
                            multiple
                            onChange={(e) =>
                              handleVariantGalleryChange(vIdx, e)
                            }
                            className="form-input"
                            accept="image/*"
                          />
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "0.5rem",
                              marginTop: "0.5rem",
                            }}
                          >
                            {v.imagePreviews?.map((pv, pIdx) => (
                              <div
                                key={pIdx}
                                style={{
                                  position: "relative",
                                  width: "60px",
                                  height: "60px",
                                }}
                              >
                                <Image
                                  src={pv}
                                  alt=""
                                  fill
                                  style={{
                                    objectFit: "cover",
                                    borderRadius: "0.25rem",
                                  }}
                                  unoptimized
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeVariantGalleryImage(vIdx, pIdx)
                                  }
                                  style={{
                                    position: "absolute",
                                    top: -5,
                                    right: -5,
                                    background: "rgba(0,0,0,0.6)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "16px",
                                    height: "16px",
                                    cursor: "pointer",
                                    fontSize: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#0369a1",
                      fontSize: "0.85rem",
                      fontStyle: "italic",
                      padding: "1rem",
                    }}
                  >
                    No variants added. Click '+ Add Variant' to create
                    variations.
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  borderTop: "1px solid #eee",
                  paddingTop: "1.5rem",
                }}
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "1rem" }}
                >
                  {isSubmitting ? "Saving..." : "Save Product"}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ flex: 1 }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Quick Attribute Modal */}
      {isAttrModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
          }}
        >
          <div
            className="glass-panel slide-up"
            style={{
              background: "white",
              padding: "2rem",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
            }}
          >
            <h3 style={{ marginBottom: "1.5rem", color: "#1e293b" }}>
              Quick Add Attribute
            </h3>
            <form
              onSubmit={handleQuickAttrSave}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="form-group">
                <label className="form-label">Attribute Name</label>
                <input
                  required
                  placeholder="e.g. Voltage, Engine No"
                  className="form-input"
                  value={attrFormData.name}
                  onChange={(e) =>
                    setAttrFormData({ ...attrFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Input Type</label>
                <select
                  className="form-input"
                  value={attrFormData.inputType}
                  onChange={(e) =>
                    setAttrFormData({
                      ...attrFormData,
                      inputType: e.target.value,
                    })
                  }
                >
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Date">Date (e.g. Expiry)</option>
                  <option value="Select">Select (Dropdown)</option>
                  <option value="Boolean">Yes/No</option>
                </select>
              </div>

              {attrFormData.inputType === "Select" && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <label className="form-label">Options</label>
                    <button
                      type="button"
                      onClick={() =>
                        setAttrFormData({
                          ...attrFormData,
                          values: [...attrFormData.values, ""],
                        })
                      }
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.2rem 0.5rem",
                        background: "#e0e7ff",
                        border: "none",
                        borderRadius: "0.25rem",
                        cursor: "pointer",
                      }}
                    >
                      + Add Option
                    </button>
                  </div>
                  {attrFormData.values.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginBottom: "0.4rem",
                      }}
                    >
                      <input
                        className="form-input"
                        style={{ flex: 1 }}
                        value={v}
                        onChange={(e) => {
                          const next = [...attrFormData.values];
                          next[i] = e.target.value;
                          setAttrFormData({ ...attrFormData, values: next });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAttrFormData({
                            ...attrFormData,
                            values: attrFormData.values.filter(
                              (_, idx) => idx !== i
                            ),
                          })
                        }
                        style={{
                          color: "red",
                          border: "none",
                          background: "none",
                          fontSize: "1.2rem",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Add & Link
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ flex: 1, background: "#f1f5f9" }}
                  onClick={() => setIsAttrModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
