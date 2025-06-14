import React, { useState } from "react";

type Props = {
    onChange: (options: string[]) => void;
};

export const AddOptionList: React.FC<Props> = ({ onChange }) => {
    const [optionList, setOptionList] = useState<string[]>([""]);

    const handleChange = (index: number, value: string) => {
        const updated = [...optionList];
        updated[index] = value;
        setOptionList(updated);
        onChange(updated);
    };

    const handleAdd = () => {
        const updated = [...optionList, ""];
        setOptionList(updated);
        onChange(updated);
    };
    const handleRemove = (index: number) => {
        const updated = optionList.filter((_, i) => i !== index);
        setOptionList(updated);
        onChange(updated);
    };

    return (
        <div>
            <label className="block mb-1 text-left text-sm">追加オプション</label>
            {
                optionList.map((opt, index) => (
                    <div key={index} className="flex gap-2">
                        <input
                            type="text"
                            className="
                                mb-1
                                p-2 
                                rounded-md 
                                bg-bg
                                border 
                                border-accent2 
                                focus:outline-none 
                                focus:ring-2 
                                focus:ring-accent2"
                            value={opt}
                            onChange={(e) => handleChange(index, e.target.value)}
                            placeholder="--get-comments"
                        />
                        <button
                            onClick={() => handleRemove(index)}
                            className="
                                mb-1
                                text-accent1"
                            disabled={optionList.length === 1}
                        >
                            削除
                        </button>
                    </div>
                ))
            }
            <button
                onClick={handleAdd}
                className="
                text-accent2 
                text-sm
                mb-4
                mt-2
                "
            >
                + オプションを追加
            </button>
        </div>
    );
}