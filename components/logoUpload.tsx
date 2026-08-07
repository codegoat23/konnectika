"use client";


import { useState } from "react";
import { Upload } from "lucide-react";
import { Label } from "./ui/label";
import Image from "next/image";
import { Input } from "./ui/input";

export default function LogoUpload(){
    const [preview, SetPreview] = useState<string | null>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>){
        const file = e.target.files?.[0];

        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        SetPreview(imageUrl)
    }
    return(
        <div className="space-y-3">
            <Label className="text-sm font-medium">
                Brand Logo
            </Label>
            <Label 
            htmlFor="logo"
            className="flex h-40 w-40 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-border hover:border-orange-500"
            >

                {preview? (
                    <Image 
                    src={preview}
                    alt="Logo Preview"
                    width={100}
                    height={100}
                    className="h-full w-full rounded-full object-cover"
                    />
                ) : (
                    <>
                    <Upload className="mb-2 h-6 w-6 text-muted-foreground"/>
                    <span className="text-sm text-muted-foreground">Upload Logo</span>
                    </>
                )}
                <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </Label>

        </div>
    )
}