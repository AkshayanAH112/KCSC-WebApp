import { PostEditor, emptyPost } from "@/components/post-editor";

export default function NewPostPage() {
  return <PostEditor initial={emptyPost} />;
}
