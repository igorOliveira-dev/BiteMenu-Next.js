"use client";

import Image from "next/image";
import React, { useState } from "react";
import { blogPosts } from "./blogData";

const normalizeText = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const BlogSection = () => {
  const [search, setSearch] = useState("");

  const orderedPosts = [...blogPosts].sort((a, b) => b.id - a.id);

  const filteredPosts = orderedPosts.filter((post) => normalizeText(post.title).includes(normalizeText(search)));

  const postsToShow = search ? filteredPosts.slice(0, 12) : orderedPosts.slice(0, 6);

  return (
    <section>
      <h1 className="default-h1">Veja os nossos últimos artigos!</h1>

      <input
        type="text"
        placeholder="Pesquisar artigos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input w-full bg-translucid border-2 border-translucid p-2 rounded my-6"
      />

      <div className="flex gap-4 items-center justify-center flex-wrap">
        {postsToShow.map((post) => (
          <a
            href={`/blog/posts/${post.slug}`}
            key={post.id}
            className="mb-2 bg-translucid p-4 rounded-lg w-full sm:max-w-md h-[220px] sm:h-[240px] border-2 border-[var(--translucid)]"
          >
            <Image src={post.mainImage} alt={post.title} width={100} height={100} className="rounded-lg" />
            <h3 className="text-[var(--gray)] font-bold mt-4 line-clamp-2">{post.title}</h3>
            <p className="text-gray-600">{post.date}</p>
          </a>
        ))}
      </div>
    </section>
  );
};

export default BlogSection;
